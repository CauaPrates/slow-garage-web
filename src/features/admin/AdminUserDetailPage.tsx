import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { errorHint, translateAdminError } from "./errors";
import { InviteStatusBadge, RoleBadge } from "./components/AdminBadges";
import { RevokeAdminDialog } from "./components/RevokeAdminDialog";
import { RevokeInviteButton } from "./components/RevokeInviteButton";
import { StatList } from "./components/StatList";
import { UserLink } from "./components/UserLink";
import { AUDIT_ACTION_LABELS, SYSTEM_ACTOR_LABEL, describeAuditMetadata } from "./labels";
import { effectiveInviteStatus } from "./useInvites";
import {
  useAdminUser,
  useInviteToAdmin,
  type AdminUserDetail,
  type EntityCounts,
  type InviteToAdminResult,
} from "./useAdmin";

const COUNT_LABELS: Record<keyof EntityCounts, string> = {
  vehicles: "Veículos",
  expenses: "Gastos",
  fuel_logs: "Abastecimentos",
  maintenance_records: "Manutenções",
  documents: "Documentos",
  issues: "Problemas",
  projects: "Projetos",
};

/** Quantos itens de convites/eventos aparecem antes de "Mostrar todos" — 20 eventos seguidos viravam uma página sem fim no celular. */
const COLLAPSED_COUNT = 5;

function CollapsibleList<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hidden = items.length - COLLAPSED_COUNT;

  return (
    <div className="flex flex-col gap-1">
      <ol className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
        {visible.map(renderItem)}
      </ol>
      {hidden > 0 && (
        <Button variant="ghost" className="self-start px-3 text-accent" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Mostrar menos" : `Mostrar todos (${items.length})`}
        </Button>
      )}
    </div>
  );
}

type Feedback = { tone: "success" | "warning"; text: string } | null;

function inviteFeedback(result: InviteToAdminResult): Feedback {
  if (result.email_sent) return { tone: "success", text: "Convite enviado por notificação e e-mail." };
  return {
    tone: "warning",
    text: `Convite criado e notificação enviada, mas o e-mail não saiu${result.email_error ? `: ${result.email_error}` : "."}`,
  };
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="text-text-secondary sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 text-text-primary">{children}</dd>
    </div>
  );
}

function AdminActions({ user, isSelf }: { user: AdminUserDetail; isSelf: boolean }) {
  const inviteToAdmin = useInviteToAdmin();
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const userLabel = user.display_name?.trim() || user.email;
  const pendingInvite = user.invites.find((invite) => effectiveInviteStatus(invite) === "pending");

  async function handleInvite() {
    setError(null);
    setFeedback(null);
    try {
      const result = await inviteToAdmin.mutateAsync(user.user_id);
      setFeedback(inviteFeedback(result));
    } catch (mutationError) {
      setError(translateAdminError(mutationError));
    }
  }

  return (
    <section
      aria-labelledby="admin-user-actions"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <h2 id="admin-user-actions" className="text-sm font-medium text-text-primary">
        Acesso ao painel
      </h2>

      {user.role === "gearhead_admin" ? (
        <>
          <p className="text-sm text-text-secondary">
            {isSelf ? "Você é administrador." : `${userLabel} é administrador.`}
          </p>
          <Button variant="destructive" className="self-start" onClick={() => setRevokeOpen(true)}>
            Remover admin
          </Button>
          <RevokeAdminDialog
            userId={user.user_id}
            userLabel={userLabel}
            isSelf={isSelf}
            open={revokeOpen}
            onOpenChange={setRevokeOpen}
            onRevoked={() => setFeedback({ tone: "success", text: `${userLabel} agora é Gearhead.` })}
          />
        </>
      ) : pendingInvite ? (
        <>
          <p className="text-sm text-text-secondary">
            Convite pendente, válido até {formatDateTime(pendingInvite.expires_at)}. Para mandar o e-mail de novo,
            cancele e convide outra vez.
          </p>
          <RevokeInviteButton inviteId={pendingInvite.id} />
        </>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            Um convite vale 7 dias. A pessoa aceita pelas notificações, logada no app.
          </p>
          <Button className="self-start" disabled={inviteToAdmin.isPending} onClick={handleInvite}>
            {inviteToAdmin.isPending ? "Convidando…" : "Convidar para admin"}
          </Button>
        </>
      )}

      <FieldError>{error}</FieldError>
      {feedback && (
        <p
          role="status"
          className={
            feedback.tone === "success"
              ? "rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
              : "rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
          }
        >
          {feedback.text}
        </p>
      )}
    </section>
  );
}

/**
 * Detalhe de um usuário (`admin_get_user`): metadados, role, contagens,
 * convites e eventos. Contagens, não conteúdo — o painel nunca busca
 * veículo, gasto ou foto de outra pessoa.
 */
export function AdminUserDetailPage() {
  const { userId = "" } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const userQuery = useAdminUser(userId);

  const backLink = (
    <Link
      to={ROUTES.adminUsers}
      className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-text-secondary hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Usuários
    </Link>
  );

  if (userQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <div className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
        <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (userQuery.isError) {
    const notFound = errorHint(userQuery.error) === "user_not_found";
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">
            {notFound ? translateAdminError(userQuery.error) : "Não foi possível carregar o usuário."}
          </p>
          {!notFound && (
            <Button variant="ghost" onClick={() => userQuery.refetch()}>
              Tentar de novo
            </Button>
          )}
        </div>
      </div>
    );
  }

  const user = userQuery.data;
  if (!user) return null;
  const isSelf = me?.id === user.user_id;

  return (
    <div className="flex flex-col gap-6">
      {backLink}

      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar avatarUrl={user.avatar_url} displayName={user.display_name} className="h-12 w-12 text-sm" />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-lg font-medium text-text-primary">
            {user.display_name?.trim() || "Sem nome de exibição"}
            {isSelf && <span className="text-sm font-normal text-text-secondary"> (você)</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm break-all text-text-secondary">{user.email}</span>
            <RoleBadge role={user.role} />
          </div>
        </div>
      </div>

      <section aria-labelledby="admin-user-meta" className="flex flex-col gap-3">
        <h2 id="admin-user-meta" className="text-sm font-medium text-text-secondary">
          Conta
        </h2>
        <dl className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-sm">
          <MetaRow label="Cadastro">{formatDateTime(user.created_at)}</MetaRow>
          <MetaRow label="Último login">
            {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "Nunca"}
          </MetaRow>
          <MetaRow label="E-mail confirmado">
            {user.email_confirmed_at ? formatDateTime(user.email_confirmed_at) : "Não confirmado"}
          </MetaRow>
          {user.role === "gearhead_admin" && (
            <>
              <MetaRow label="Admin desde">{user.granted_at ? formatDateTime(user.granted_at) : "Não registrado"}</MetaRow>
              <MetaRow label="Promovido por">
                <UserLink userId={user.granted_by} fallback="Não registrado (promoção manual ou conta excluída)" />
              </MetaRow>
            </>
          )}
        </dl>
      </section>

      <AdminActions user={user} isSelf={isSelf} />

      <section aria-labelledby="admin-user-counts" className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="admin-user-counts" className="text-sm font-medium text-text-secondary">
            Registros
          </h2>
          <p className="text-xs text-text-secondary">Só contagens — o conteúdo é privado de quem registrou.</p>
        </div>
        <StatList
          stats={(Object.keys(COUNT_LABELS) as (keyof EntityCounts)[]).map((key) => ({
            label: COUNT_LABELS[key],
            value: user.counts[key],
          }))}
          columnsClassName="sm:grid-cols-4 xl:grid-cols-7"
        />
      </section>

      <section aria-labelledby="admin-user-invites" className="flex flex-col gap-3">
        <h2 id="admin-user-invites" className="text-sm font-medium text-text-secondary">
          Convites recebidos
        </h2>
        {user.invites.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhum convite para admin até agora.</p>
        ) : (
          <CollapsibleList
            items={user.invites}
            renderItem={(invite) => (
              <li key={invite.id} className="flex flex-col gap-0.5 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <InviteStatusBadge invite={invite} />
                  <time dateTime={invite.created_at} className="text-xs text-text-secondary">
                    {formatDateTime(invite.created_at)}
                  </time>
                </div>
                <p className="text-xs text-text-secondary">
                  Por <UserLink userId={invite.invited_by} fallback="conta excluída" inline /> · até{" "}
                  {formatDateTime(invite.expires_at)} · {invite.email_sent_at ? "e-mail enviado" : "sem e-mail"}
                </p>
              </li>
            )}
          />
        )}
      </section>

      <section aria-labelledby="admin-user-events" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-user-events" className="text-sm font-medium text-text-secondary">
            Eventos recentes
          </h2>
          <Link
            to={ROUTES.adminAuditForUser(user.user_id)}
            className="inline-flex min-h-11 items-center text-sm text-accent underline-offset-4 hover:underline"
          >
            Ver tudo no log
          </Link>
        </div>
        {user.recent_events.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhum evento registrado.</p>
        ) : (
          <CollapsibleList
            items={user.recent_events}
            renderItem={(event) => {
              const details = describeAuditMetadata(event.action, event.metadata);
              return (
                <li key={event.id} className="flex flex-col gap-0.5 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-medium text-text-primary">{AUDIT_ACTION_LABELS[event.action]}</span>
                    <time dateTime={event.occurred_at} className="text-xs text-text-secondary">
                      {formatDateTime(event.occurred_at)}
                    </time>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {details && `${details} · `}por{" "}
                    {event.actor_id === null ? (
                      SYSTEM_ACTOR_LABEL.toLowerCase()
                    ) : event.actor_id === user.user_id ? (
                      "esta pessoa"
                    ) : (
                      <UserLink userId={event.actor_id} inline />
                    )}
                  </p>
                </li>
              );
            }}
          />
        )}
      </section>
    </div>
  );
}
