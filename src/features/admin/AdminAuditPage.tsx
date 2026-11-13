import { useId, useRef } from "react";
import { Link } from "react-router-dom";
import { ScrollText, X } from "lucide-react";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, NoResults } from "@/components/ui/feedback";
import { FilterField } from "@/components/ui/form";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { SkeletonList } from "@/components/ui/skeleton";
import { textLinkClassName } from "@/components/ui/text-link";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import { formatCount, formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Pagination } from "./components/Pagination";
import { UserLink, useUserLabel } from "./components/UserLink";
import { AUDIT_ACTION_LABELS, SYSTEM_ACTOR_LABEL, describeAuditMetadata } from "./labels";
import { ADMIN_PAGE_SIZE, useAdminAuditLogs, type AuditAction, type AuditLogRow } from "./useAdmin";
import { useAdminListParams } from "./useAdminListParams";

const ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS) as [AuditAction, string][];

function parseAction(value: string | null): AuditAction | "all" {
  return value && value in AUDIT_ACTION_LABELS ? (value as AuditAction) : "all";
}

/** Colunas a partir de `lg`: ação (e detalhe) · quem fez · alvo · data. */
const AUDIT_ROW_GRID = "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_9rem] lg:gap-x-4";

type PersonProps = { id: string | null; name: string | null; email: string | null; fallback: string };

/**
 * Pessoa de um evento: nome em link (alvo de 44px) e o e-mail embaixo; sem
 * nome, o e-mail é o link. E-mail longo quebra em qualquer ponto. Sem id:
 * `actor_id` nulo é mudança feita direto no banco; alvo nulo, conta excluída.
 */
function Person({ id, name, email, fallback }: PersonProps) {
  if (!id) return <span className="text-sm text-text-secondary">{fallback}</span>;
  const label = name?.trim() || email || "Usuário";
  return (
    <span className="flex min-w-0 flex-col">
      <Link to={ROUTES.adminUser(id)} className={cn(textLinkClassName("sm"), "-my-2.5 -ml-1 self-start wrap-anywhere text-left")}>
        {label}
      </Link>
      {name?.trim() && email && <span className="text-xs wrap-anywhere text-text-secondary">{email}</span>}
    </span>
  );
}

/**
 * Um evento: a ação primeiro (com o detalhe que o `metadata` dá — de/para do
 * papel e a origem), quem fez, o alvo e a data. No celular a data fica ao lado
 * da ação e as pessoas descem uma por linha, com rótulo.
 */
function AuditRow({ row }: { row: AuditLogRow }) {
  const details = describeAuditMetadata(row.action, row.metadata);
  return (
    <li className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-(--panel-pad-x) py-3", AUDIT_ROW_GRID)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="type-item-title text-text-primary">{AUDIT_ACTION_LABELS[row.action]}</span>
        {details && <span className="text-xs break-words text-text-secondary">{details}</span>}
      </div>
      <time
        dateTime={row.occurred_at}
        className="text-right text-xs text-text-secondary tabular-nums lg:order-last lg:text-sm lg:text-text-primary"
      >
        {formatDateTime(row.occurred_at)}
      </time>
      <div className="col-span-2 flex min-w-0 gap-2 lg:col-span-1 lg:block">
        <span className="w-16 shrink-0 pt-0.5 text-xs text-text-secondary lg:sr-only">Quem fez</span>
        <Person id={row.actor_id} name={row.actor_name} email={row.actor_email} fallback={SYSTEM_ACTOR_LABEL} />
      </div>
      <div className="col-span-2 flex min-w-0 gap-2 lg:col-span-1 lg:block">
        <span className="w-16 shrink-0 pt-0.5 text-xs text-text-secondary lg:sr-only">Alvo</span>
        <Person id={row.target_user_id} name={row.target_name} email={row.target_email} fallback="Conta excluída" />
      </div>
    </li>
  );
}

/**
 * Log de auditoria (`admin_list_audit_logs`): eventos de conta e segurança,
 * mais recente primeiro. Ação, usuário e página moram na URL.
 *
 * Etapa 16: cabeçalho de gestão, a lista num painel com a contagem e a
 * paginação no rodapé; prioridade na ação, em quem fez, no alvo e na data.
 * O filtro de usuário é uma etiqueta com o nome e um botão nomeado para tirá-lo
 * (o foco vai para o filtro de ação depois). Não há dado técnico a expandir:
 * o `metadata` vira o detalhe da ação, como antes.
 */
export function AdminAuditPage() {
  const { params, page, setFilters, setPage } = useAdminListParams();
  const action = parseAction(params.get("acao"));
  const userId = params.get("usuario");
  const logsQuery = useAdminAuditLogs({ action, userId, page });
  const userLabel = useUserLabel(userId);
  const rows = logsQuery.data?.rows ?? [];
  const totalCount = logsQuery.data?.totalCount ?? 0;
  const hasFilters = action !== "all" || userId !== null;
  const ready = logsQuery.data && !logsQuery.isError;
  const titleId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLSelectElement>(null);
  const retry = useRetryFocus(logsQuery.dataUpdatedAt, listRef);

  const selection = [action !== "all" && `ação “${AUDIT_ACTION_LABELS[action]}”`, userId && `usuário ${userLabel ?? ""}`.trim()]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <PageHeader
        title="Log de auditoria"
        description="Eventos de conta e de acesso de todo o app: cadastros, mudanças de papel e convites."
      />

      <section aria-labelledby={titleId} className={PANEL_CLASSNAME}>
        <PanelHeader
          title="Eventos"
          titleId={titleId}
          description="Mais recente primeiro."
          action={
            <PanelCount>
              {ready &&
                rows.length > 0 &&
                `${formatCount(totalCount)} ${totalCount === 1 ? "evento" : "eventos"}${hasFilters ? " nesta seleção" : ""}`}
            </PanelCount>
          }
        />

        <div className="flex flex-col gap-3 border-b border-border px-(--panel-pad-x) py-(--panel-pad-y) sm:flex-row sm:flex-wrap sm:items-end">
          <FilterField id="admin-audit-action" label="Ação" className="sm:w-60">
            <Select
              ref={actionRef}
              id="admin-audit-action"
              value={action}
              onChange={(event) => setFilters({ acao: event.target.value === "all" ? null : event.target.value })}
            >
              <option value="all">Todas as ações</option>
              {ACTION_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FilterField>
          {userId ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="type-label text-text-primary">Usuário</p>
              <div className="flex min-h-control min-w-0 items-center gap-1 rounded-md border border-border bg-surface-raised pl-3 text-sm">
                <span className="min-w-0 py-1">
                  <UserLink userId={userId} inline />
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover filtro de usuário${userLabel ? `: ${userLabel}` : ""}`}
                  onClick={() => {
                    setFilters({ usuario: null });
                    actionRef.current?.focus();
                  }}
                  className="ml-auto shrink-0"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="pb-3 text-xs text-text-secondary sm:flex-1">
              Para ver só os eventos de uma pessoa, abra o usuário e use “Ver tudo no log”.
            </p>
          )}
        </div>

        <div ref={listRef} tabIndex={-1} className="outline-offset-[-2px]">
          {logsQuery.isLoading && <SkeletonList label="Carregando eventos…" />}

          {logsQuery.isError && (
            <InlineError onRetry={() => retry(logsQuery.refetch)}>
              Não foi possível carregar o log. Os filtros continuam como estão.
            </InlineError>
          )}

          {ready && rows.length === 0 &&
            (page > 0 ? (
              <NoResults
                message="Não há eventos nesta página."
                detail="O log encolheu desde que o link foi aberto."
                onClear={() => setPage(0)}
                clearLabel="Voltar para a primeira página"
              />
            ) : hasFilters ? (
              <NoResults
                message="Nenhum evento com esses filtros."
                detail={`Seleção atual: ${selection}.`}
                onClear={() => setFilters({ acao: null, usuario: null })}
              />
            ) : (
              <EmptyState icon={ScrollText} title="Nenhum evento registrado ainda." variant="inline" />
            ))}

          {ready && rows.length > 0 && (
            <>
              <ListColumns className={AUDIT_ROW_GRID}>
                <span>Ação</span>
                <span>Quem fez</span>
                <span>Alvo</span>
                <span className="text-right">Data</span>
              </ListColumns>
              <ul className="divide-y divide-border" aria-busy={(logsQuery.isFetching && logsQuery.isPlaceholderData) || undefined}>
                {rows.map((row) => (
                  <AuditRow key={row.id} row={row} />
                ))}
              </ul>
            </>
          )}
        </div>

        {ready && (
          <Pagination
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={setPage}
            isFetching={logsQuery.isFetching}
            itemLabel={totalCount === 1 ? "evento" : "eventos"}
          />
        )}
      </section>
    </div>
  );
}
