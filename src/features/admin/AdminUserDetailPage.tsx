import { useId, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Loader2, ShieldCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState, InlineError, PageError } from "@/components/ui/feedback";
import { FieldError } from "@/components/ui/field-error";
import { PANEL_LINK_CLASSNAME, Panel, PanelCount } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { textLinkClassName } from "@/components/ui/text-link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/features/auth/AuthProvider";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import { formatCount, formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { errorHint, translateAdminError } from "./errors";
import { InviteStatusBadge, RoleBadge } from "./components/AdminBadges";
import { RevokeAdminDialog } from "./components/RevokeAdminDialog";
import { RevokeInviteButton } from "./components/RevokeInviteButton";
import { StatList } from "./components/StatList";
import { UserLink } from "./components/UserLink";
import { inviteEmailText, inviteValidityText } from "./invitePresentation";
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

/** Lista dentro de um painel; acima de 5 itens, o resto fica atrás de um botão no rodapé (`aria-expanded`). */
function CollapsibleList<T>({ items, noun, renderItem }: { items: T[]; noun: string; renderItem: (item: T) => ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hidden = items.length - COLLAPSED_COUNT;

  return (
    <>
      <ol id={listId} className="divide-y divide-border">
        {visible.map(renderItem)}
      </ol>
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-control w-full items-center justify-between gap-2 border-t border-border px-(--panel-pad-x) py-2 text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
        >
          {expanded ? `Mostrar só os ${COLLAPSED_COUNT} mais recentes` : `Mostrar todos os ${formatCount(items.length)} ${noun}`}
          <ChevronDown
            aria-hidden="true"
            className={cn("h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform", expanded && "rotate-180")}
          />
        </button>
      )}
    </>
  );
}

/** Linha de ficha: rótulo e valor; no celular empilhados, do `sm` pra cima lado a lado. */
function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-(--panel-pad-x) py-2.5 text-sm sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="min-w-0 wrap-anywhere text-text-primary">{children}</dd>
    </div>
  );
}

type Feedback = { tone: "success" | "warning"; text: string };

function inviteFeedback(result: InviteToAdminResult, label: string): Feedback {
  if (result.email_sent) {
    return {
      tone: "success",
      text: `Convite enviado para ${label} por notificação e e-mail. A pessoa só vira administradora depois de aceitar.`,
    };
  }
  return {
    tone: "warning",
    text: `Convite criado e notificação enviada, mas o e-mail não saiu${result.email_error ? `: ${result.email_error}` : ""}. ${label} ainda pode aceitar pelas notificações do app.`,
  };
}

/**
 * Papel atual e ações de acesso — dois painéis lado a lado no desktop.
 *
 * O retorno de cada ação (enviado, e-mail que não saiu, removido, convite
 * cancelado) aparece no painel de ações, **acima** do botão, e recebe o foco:
 * o botão que foi usado some (o papel ou o convite mudou) e o foco não pode
 * cair no `<body>`. Acima, e não abaixo, também tira o "Cancelar convite" do
 * lugar exato do "Convidar para admin" — antes, um clique duplo rápido
 * convidava e cancelava em seguida.
 */
function AccessPanels({ user, isSelf }: { user: AdminUserDetail; isSelf: boolean }) {
  const inviteToAdmin = useInviteToAdmin();
  const [revokeTarget, setRevokeTarget] = useState<AdminUserDetail | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const name = user.display_name?.trim() || null;
  const label = name ?? user.email;
  const isAdmin = user.role === "gearhead_admin";
  const pendingInvite = user.invites.find((invite) => effectiveInviteStatus(invite) === "pending");

  /** Depois do envio o feedback já está na tela; o foco vai pra ele (ou pro painel, se não houver). */
  function focusFeedback() {
    requestAnimationFrame(() => (feedbackRef.current ?? bodyRef.current)?.focus({ focusVisible: true }));
  }

  async function handleInvite() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    setFeedback(null);
    try {
      const result = await inviteToAdmin.mutateAsync(user.user_id);
      setFeedback(inviteFeedback(result, label));
      focusFeedback();
    } catch (mutationError) {
      setError(translateAdminError(mutationError));
    } finally {
      sendingRef.current = false;
    }
  }

  return (
    <>
      <Panel title="Papel atual">
        <dl className="divide-y divide-border">
          <MetaRow label="Papel">
            <RoleBadge role={user.role} />
          </MetaRow>
          {isAdmin ? (
            <>
              <MetaRow label="Administrador desde">
                {user.granted_at ? formatDateTime(user.granted_at) : <span className="text-text-secondary">Não registrado</span>}
              </MetaRow>
              <MetaRow label="Promovido por">
                <UserLink userId={user.granted_by} fallback="Não registrado (promoção manual ou conta excluída)" />
              </MetaRow>
            </>
          ) : (
            <MetaRow label="Convite">
              {pendingInvite ? (
                <>
                  Pendente desde {formatDateTime(pendingInvite.created_at)} ·{" "}
                  {inviteValidityText(pendingInvite).toLowerCase()}
                </>
              ) : (
                <span className="text-text-secondary">Nenhum pendente</span>
              )}
            </MetaRow>
          )}
        </dl>
      </Panel>

      <Panel title="Acesso ao painel" className="lg:col-span-2 xl:col-span-1">
        <div ref={bodyRef} tabIndex={-1} className="flex flex-col items-start gap-3 px-(--panel-pad-x) py-4 outline-offset-[-2px]">
          <p className="max-w-prose text-sm text-text-secondary">
            {isAdmin
              ? isSelf
                ? "Você é administrador. Deixar de ser devolve o papel Gearhead na hora: o painel sai do seu menu e seus veículos e registros não mudam."
                : `${label} é administrador. Remover devolve o papel Gearhead na hora: o painel deixa de abrir para a pessoa, ela recebe uma notificação e os veículos e registros dela não mudam.`
              : pendingInvite
                ? `${label} ainda não é administrador: vira quando aceitar o convite pelas notificações do app. Para mandar o e-mail de novo, cancele e convide outra vez.`
                : `Um convite vale 7 dias. ${label} recebe uma notificação e um e-mail e só vira administrador depois de aceitar, logado no app.`}
          </p>

          {feedback && (
            <div ref={feedbackRef} tabIndex={-1} className="w-full rounded-lg outline-offset-2">
              <Alert tone={feedback.tone} role="status">
                {feedback.text}
              </Alert>
            </div>
          )}

          {/*
            `key` diferente em cada ação: sem ela o React reaproveitava o mesmo <button> — depois de remover, o
            "Remover admin" virava "Convidar para admin" no mesmo nó, o foco voltava pra ele e um Enter a mais
            convidava a pessoa de novo. Com nós distintos, o gatilho sai da tela e o foco vai para o retorno.
          */}
          {isAdmin ? (
            <Button
              key="revoke"
              variant="outline"
              className="text-error hover:bg-error/10"
              onClick={() => {
                setError(null);
                setFeedback(null);
                setRevokeTarget(user);
                setRevokeOpen(true);
              }}
            >
              {isSelf ? "Deixar de ser admin" : "Remover admin"}
            </Button>
          ) : pendingInvite ? (
            <RevokeInviteButton
              key="cancel-invite"
              inviteId={pendingInvite.id}
              accessibleLabel={`Cancelar convite de ${label}`}
              onRevoked={() => {
                setFeedback({ tone: "success", text: `Convite cancelado. ${label} não pode mais aceitá-lo.` });
                focusFeedback();
              }}
            />
          ) : (
            <Button key="invite" aria-disabled={inviteToAdmin.isPending || undefined} onClick={handleInvite}>
              {inviteToAdmin.isPending ? (
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              {inviteToAdmin.isPending ? "Convidando…" : "Convidar para admin"}
            </Button>
          )}

          <FieldError>{error}</FieldError>
        </div>
      </Panel>

      {revokeTarget && (
        <RevokeAdminDialog
          user={revokeTarget}
          isSelf={isSelf}
          open={revokeOpen}
          onOpenChange={setRevokeOpen}
          onRevoked={() =>
            setFeedback({ tone: "success", text: `${label} agora é Gearhead e não acessa mais o painel.` })
          }
          focusFallback={() => feedbackRef.current ?? bodyRef.current}
        />
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link to={ROUTES.adminUsers} className={cn(textLinkClassName("sm"), "-my-2 -ml-1 self-start")}>
      <ArrowLeft className="h-4 w-4 text-accent" aria-hidden="true" />
      <span className="sr-only">Voltar para </span>Usuários
    </Link>
  );
}

/**
 * Detalhe de um usuário (`admin_get_user`): metadados, papel, contagens,
 * convites e eventos. Contagens, não conteúdo — o painel nunca busca
 * veículo, gasto ou foto de outra pessoa.
 *
 * Etapa 16: cabeçalho com o nome (ou o e-mail, sem nome) no papel de nome de
 * registro; identificação, papel atual e acesso ao painel em painéis
 * separados; registros, convites recebidos (até 10, do banco) e eventos
 * recentes (até 20, em que a pessoa agiu ou foi afetada) em painéis com o
 * escopo escrito. Selos comuns; contagens no papel de indicador.
 */
export function AdminUserDetailPage() {
  const { userId = "" } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const userQuery = useAdminUser(userId);
  const contentRef = useRef<HTMLDivElement>(null);
  const retry = useRetryFocus(userQuery.dataUpdatedAt, contentRef);

  if (userQuery.isLoading) {
    return (
      <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
        <BackLink />
        <span className="sr-only">Carregando usuário…</span>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (userQuery.isError && !userQuery.data) {
    const notFound = errorHint(userQuery.error) === "user_not_found";
    return (
      <div className="flex flex-col gap-(--page-gap)">
        <BackLink />
        {notFound ? (
          <EmptyState icon={UserX} title="Usuário não encontrado.">
            A conta pode ter sido excluída. Volte para a lista para escolher outra.
          </EmptyState>
        ) : (
          <PageError message="Não foi possível carregar o usuário." onRetry={() => retry(userQuery.refetch)} />
        )}
      </div>
    );
  }

  const user = userQuery.data;
  if (!user) return null;
  const isSelf = me?.id === user.user_id;
  const name = user.display_name?.trim() || null;

  return (
    <div ref={contentRef} tabIndex={-1} className="flex flex-col gap-(--page-gap) rounded-md outline-offset-4">
      <BackLink />

      <header className="flex min-w-0 items-start gap-3">
        <UserAvatar avatarUrl={user.avatar_url} displayName={user.display_name} className="mt-0.5 h-12 w-12 text-sm" />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-entity-title wrap-anywhere text-text-primary">
            {name ?? user.email}
            {isSelf && <span className="text-base font-normal text-text-secondary"> (você)</span>}
          </h1>
          <p className="text-sm wrap-anywhere text-text-secondary">{name ? user.email : "Sem nome de exibição"}</p>
        </div>
      </header>

      {userQuery.isError && (
        <InlineError onRetry={() => retry(userQuery.refetch)} className="p-0">
          Não foi possível atualizar este usuário. Os dados abaixo podem estar desatualizados.
        </InlineError>
      )}

      <div className="grid gap-(--page-gap) lg:grid-cols-2 lg:items-start xl:grid-cols-3">
        <Panel title="Identificação" description="Dados da conta, como a pessoa cadastrou.">
          <dl className="divide-y divide-border">
            <MetaRow label="Nome de exibição">{name ?? <span className="text-text-secondary">Não informado</span>}</MetaRow>
            <MetaRow label="E-mail">{user.email}</MetaRow>
            <MetaRow label="E-mail confirmado">
              {user.email_confirmed_at ? formatDateTime(user.email_confirmed_at) : <span className="text-text-secondary">Não confirmado</span>}
            </MetaRow>
            <MetaRow label="Cadastro">{formatDateTime(user.created_at)}</MetaRow>
            <MetaRow label="Último login">
              {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : <span className="text-text-secondary">Nunca</span>}
            </MetaRow>
          </dl>
        </Panel>
        <AccessPanels key={user.user_id} user={user} isSelf={isSelf} />
      </div>

      <Panel title="Registros" description="Só a contagem — o conteúdo é privado de quem registrou.">
        <StatList
          stats={(Object.keys(COUNT_LABELS) as (keyof EntityCounts)[]).map((key) => ({
            label: COUNT_LABELS[key],
            value: user.counts[key],
          }))}
          columnsClassName="sm:grid-cols-4 xl:grid-cols-7"
        />
      </Panel>

      <div className="grid gap-(--page-gap) xl:grid-cols-2 xl:items-start">
        <Panel
          title="Convites recebidos"
          description="Os 10 mais recentes para Administrador Gearhead."
          action={
            user.invites.length > 0 && (
              <PanelCount>
                {formatCount(user.invites.length)} {user.invites.length === 1 ? "convite" : "convites"}
              </PanelCount>
            )
          }
        >
          {user.invites.length === 0 ? (
            <p className="px-(--panel-pad-x) py-4 text-sm text-text-secondary">Nenhum convite para admin até agora.</p>
          ) : (
            <CollapsibleList
              items={user.invites}
              noun="convites"
              renderItem={(invite) => (
                <li key={invite.id} className="flex flex-col gap-1 px-(--panel-pad-x) py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <InviteStatusBadge invite={invite} />
                    <span className="text-xs text-text-secondary tabular-nums">
                      Enviado em <time dateTime={invite.created_at}>{formatDateTime(invite.created_at)}</time>
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Por <UserLink userId={invite.invited_by} fallback="conta excluída" inline /> ·{" "}
                    {inviteValidityText(invite)} · {inviteEmailText(invite)}
                  </p>
                </li>
              )}
            />
          )}
        </Panel>

        <Panel
          title="Eventos recentes"
          description="Os 20 mais recentes em que a pessoa agiu ou foi o alvo."
          action={
            <Link to={ROUTES.adminAuditForUser(user.user_id)} className={PANEL_LINK_CLASSNAME}>
              Ver tudo no log
            </Link>
          }
        >
          {user.recent_events.length === 0 ? (
            <p className="px-(--panel-pad-x) py-4 text-sm text-text-secondary">Nenhum evento registrado.</p>
          ) : (
            <CollapsibleList
              items={user.recent_events}
              noun="eventos"
              renderItem={(event) => {
                const details = describeAuditMetadata(event.action, event.metadata);
                return (
                  <li key={event.id} className="flex flex-col gap-0.5 px-(--panel-pad-x) py-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="type-item-title text-text-primary">{AUDIT_ACTION_LABELS[event.action]}</span>
                      <time dateTime={event.occurred_at} className="text-xs text-text-secondary tabular-nums">
                        {formatDateTime(event.occurred_at)}
                      </time>
                    </div>
                    {details && <p className="text-xs text-text-secondary">{details}</p>}
                    <p className="text-xs text-text-secondary">
                      Por{" "}
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
        </Panel>
      </div>
    </div>
  );
}
