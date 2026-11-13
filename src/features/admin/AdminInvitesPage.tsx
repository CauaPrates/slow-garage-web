import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MailPlus } from "lucide-react";
import { ActionLabel, PageHeader } from "@/components/layout/Page";
import { buttonVariants } from "@/components/ui/button";
import { Alert, EmptyState, InlineError, NoResults } from "@/components/ui/feedback";
import { FilterField } from "@/components/ui/form";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { SkeletonList } from "@/components/ui/skeleton";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import { formatCount, formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { InviteStatusBadge } from "./components/AdminBadges";
import { RevokeInviteButton } from "./components/RevokeInviteButton";
import { UserLink, useUserLabel } from "./components/UserLink";
import { inviteEmailText, inviteValidityText } from "./invitePresentation";
import { INVITE_STATUS_LABELS, effectiveInviteStatus, type AdminInviteRow, type AdminInviteStatus } from "./useInvites";
import { useAdminInvites, type InviteStatusFilter } from "./useAdmin";
import { useAdminListParams } from "./useAdminListParams";

const STATUS_OPTIONS = Object.entries(INVITE_STATUS_LABELS) as [AdminInviteStatus, string][];

function parseStatus(value: string | null): InviteStatusFilter {
  return value && value in INVITE_STATUS_LABELS ? (value as AdminInviteStatus) : "all";
}

/** Quem convidar sai da lista de usuários — só Gearhead pode receber convite. */
const INVITE_SOMEONE_HREF = `${ROUTES.adminUsers}?role=gearhead`;

/** Colunas a partir de `lg`: destinatário (e quem enviou) · situação · validade · ação. */
const INVITE_ROW_GRID = "lg:grid-cols-[minmax(0,1fr)_8rem_minmax(0,15rem)_11rem] lg:items-center lg:gap-x-4";

/**
 * Um convite: destinatário primeiro (link para o usuário), a situação no
 * selo comum (mesmos rótulos e tons da etapa 15) e a validade escrita pela
 * situação — pendente "vale até", expirado "venceu em", respondido ou
 * cancelado com a data. Pendente válido tem "Cancelar convite" à vista; o
 * nome acessível diz de quem é.
 */
function InviteRow({ invite, onRevoked }: { invite: AdminInviteRow; onRevoked: (label: string) => void }) {
  const status = effectiveInviteStatus(invite);
  const label = useUserLabel(invite.invitee_id) ?? "este usuário";
  return (
    <li className={cn("grid grid-cols-1 gap-y-1.5 px-(--panel-pad-x) py-3", INVITE_ROW_GRID)}>
      <div className="flex min-w-0 flex-col">
        <span className="type-item-title">
          <UserLink userId={invite.invitee_id} />
        </span>
        <p className="text-xs text-text-secondary">
          Enviado em <time dateTime={invite.created_at}>{formatDateTime(invite.created_at)}</time> por{" "}
          <UserLink userId={invite.invited_by} fallback="conta excluída" inline /> · {inviteEmailText(invite)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 lg:contents">
        <div>
          <InviteStatusBadge invite={invite} />
        </div>
        <p className="text-sm text-text-primary tabular-nums">{inviteValidityText(invite)}</p>
      </div>
      <div className="pt-1 lg:flex lg:justify-end lg:pt-0">
        {status === "pending" && (
          <RevokeInviteButton
            inviteId={invite.id}
            accessibleLabel={`Cancelar convite de ${label}`}
            onRevoked={() => onRevoked(label)}
          />
        )}
      </div>
    </li>
  );
}

/**
 * Todos os convites (admin vê todos pela RLS). Pendente vencido aparece e
 * filtra como "Expirado". Convite enviado não é acesso: a pessoa só vira
 * administradora quando aceita (situação "Aceito").
 *
 * Etapa 16: cabeçalho de gestão com a ação de convidar (leva à lista de
 * usuários Gearhead — convidar é no detalhe de cada um, como antes), lista num
 * painel com a contagem e o filtro de situação, linhas com colunas a partir de
 * `lg`. Cancelar mostra o retorno no topo da lista e leva o foco até ele: o
 * botão some (o convite deixa de ser pendente) e o foco caía no `<body>`.
 */
export function AdminInvitesPage() {
  const { params, setFilters } = useAdminListParams();
  const status = parseStatus(params.get("status"));
  const invitesQuery = useAdminInvites(status);
  const invites = invitesQuery.data ?? [];
  const titleId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const retry = useRetryFocus(invitesQuery.dataUpdatedAt, listRef);
  const [feedback, setFeedback] = useState<string | null>(null);
  const ready = invitesQuery.data && !invitesQuery.isError;

  function handleRevoked(label: string) {
    setFeedback(`Convite de ${label} cancelado. A pessoa não pode mais aceitá-lo.`);
    requestAnimationFrame(() => feedbackRef.current?.focus({ focusVisible: true }));
  }

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="Convites"
        description="Convites para Administrador Gearhead. Enviar não dá acesso: a pessoa só vira administradora quando aceita."
        actions={
          <Link to={INVITE_SOMEONE_HREF} className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>
            <MailPlus className="h-4 w-4" aria-hidden="true" />
            <ActionLabel short="Convidar" rest="alguém" />
          </Link>
        }
      />

      {feedback && (
        <div ref={feedbackRef} tabIndex={-1} className="rounded-lg outline-offset-2">
          <Alert tone="success" role="status">
            {feedback}
          </Alert>
        </div>
      )}

      <section aria-labelledby={titleId} className={PANEL_CLASSNAME}>
        <PanelHeader
          title="Enviados"
          titleId={titleId}
          description="Mais recente primeiro."
          action={
            <PanelCount>
              {ready &&
                invites.length > 0 &&
                `${formatCount(invites.length)} ${invites.length === 1 ? "convite" : "convites"}${status !== "all" ? " nesta seleção" : ""}`}
            </PanelCount>
          }
        />

        <div className="border-b border-border px-(--panel-pad-x) py-(--panel-pad-y)">
          <FilterField id="admin-invites-status" label="Situação" className="sm:w-60">
            <Select
              id="admin-invites-status"
              value={status}
              onChange={(event) => {
                setFeedback(null);
                setFilters({ status: event.target.value === "all" ? null : event.target.value });
              }}
            >
              <option value="all">Todas as situações</option>
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FilterField>
        </div>

        <div ref={listRef} tabIndex={-1} className="outline-offset-[-2px]">
          {invitesQuery.isLoading && <SkeletonList label="Carregando convites…" />}

          {invitesQuery.isError && (
            <InlineError onRetry={() => retry(invitesQuery.refetch)}>
              Não foi possível carregar os convites. O filtro continua como está.
            </InlineError>
          )}

          {ready && invites.length === 0 &&
            (status === "all" ? (
              <EmptyState
                icon={MailPlus}
                title="Nenhum convite enviado ainda."
                variant="inline"
                action={
                  <Link to={INVITE_SOMEONE_HREF} className={buttonVariants({ variant: "outline" })}>
                    Escolher quem convidar
                  </Link>
                }
              >
                Para convidar, abra um usuário Gearhead na lista de usuários.
              </EmptyState>
            ) : (
              <NoResults
                message={`Nenhum convite com a situação “${INVITE_STATUS_LABELS[status]}”.`}
                onClear={() => setFilters({ status: null })}
                clearLabel="Ver todas as situações"
              />
            ))}

          {ready && invites.length > 0 && (
            <>
              <ListColumns className={INVITE_ROW_GRID}>
                <span>Destinatário</span>
                <span>Situação</span>
                <span>Validade</span>
                <span />
              </ListColumns>
              <ul className="divide-y divide-border">
                {invites.map((invite) => (
                  <InviteRow key={invite.id} invite={invite} onRevoked={handleRevoked} />
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
