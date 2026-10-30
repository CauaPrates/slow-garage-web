import { Link } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { Pagination } from "./components/Pagination";
import { UserLink } from "./components/UserLink";
import { AUDIT_ACTION_LABELS, SYSTEM_ACTOR_LABEL, describeAuditMetadata } from "./labels";
import { ADMIN_PAGE_SIZE, useAdminAuditLogs, type AuditAction, type AuditLogRow } from "./useAdmin";
import { useAdminListParams } from "./useAdminListParams";

const ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS) as [AuditAction, string][];

function parseAction(value: string | null): AuditAction | "all" {
  return value && value in AUDIT_ACTION_LABELS ? (value as AuditAction) : "all";
}

type PersonProps = { id: string | null; name: string | null; email: string | null; fallback: string; inline?: boolean };

/** `inline`: dentro de uma frase no cartão mobile — só o nome (ou e-mail), sem a altura mínima de alvo que esticaria a linha. */
function PersonCell({ id, name, email, fallback, inline = false }: PersonProps) {
  if (!id) {
    return <span className={inline ? "text-text-secondary" : "inline-flex min-h-11 items-center text-text-secondary"}>{fallback}</span>;
  }
  if (inline) {
    return (
      <Link to={ROUTES.adminUser(id)} className="break-all text-accent underline underline-offset-4">
        {name?.trim() || email || "Usuário"}
      </Link>
    );
  }
  return (
    <Link
      to={ROUTES.adminUser(id)}
      className="inline-flex min-h-11 flex-col justify-center text-left underline-offset-4 hover:underline"
    >
      <span className="text-text-primary">{name?.trim() || email || "Usuário"}</span>
      {name?.trim() && email && <span className="text-xs break-all text-text-secondary">{email}</span>}
    </Link>
  );
}

function Actor({ row, inline }: { row: AuditLogRow; inline?: boolean }) {
  // actor_id nulo = mudança direto no banco (metadata.source = 'manual').
  return <PersonCell id={row.actor_id} name={row.actor_name} email={row.actor_email} fallback={SYSTEM_ACTOR_LABEL} inline={inline} />;
}

function Target({ row, inline }: { row: AuditLogRow; inline?: boolean }) {
  return <PersonCell id={row.target_user_id} name={row.target_name} email={row.target_email} fallback="—" inline={inline} />;
}

/** Log de auditoria (`admin_list_audit_logs`): eventos de conta e segurança, mais recente primeiro. */
export function AdminAuditPage() {
  const { params, page, setFilters, setPage } = useAdminListParams();
  const action = parseAction(params.get("acao"));
  const userId = params.get("usuario");
  const logsQuery = useAdminAuditLogs({ action, userId, page });
  const rows = logsQuery.data?.rows ?? [];
  const hasFilters = action !== "all" || userId !== null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-medium text-text-primary">Log de auditoria</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5 sm:w-60">
          <Label htmlFor="admin-audit-action">Ação</Label>
          <Select
            id="admin-audit-action"
            value={action}
            onChange={(event) => setFilters({ acao: event.target.value === "all" ? null : event.target.value })}
          >
            <option value="all">Todas</option>
            {ACTION_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        {userId && (
          <div className="flex min-w-0 items-center gap-1 rounded-md border border-border bg-surface pl-3 text-sm">
            <span className="shrink-0 text-text-secondary">Usuário:</span>
            <UserLink userId={userId} />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remover filtro de usuário"
              onClick={() => setFilters({ usuario: null })}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {!userId && (
        <p className="text-xs text-text-secondary">
          Para ver só os eventos de uma pessoa, abra o usuário e use "Ver tudo no log".
        </p>
      )}

      {logsQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {logsQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar o log.</p>
          <Button variant="ghost" onClick={() => logsQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {logsQuery.data && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-secondary">
            {page > 0 ? "Não há eventos nesta página." : "Nenhum evento com esses filtros."}
          </p>
          {page > 0 ? (
            <Button variant="ghost" onClick={() => setPage(0)}>
              Voltar para a primeira página
            </Button>
          ) : (
            hasFilters && (
              <Button variant="ghost" onClick={() => setFilters({ acao: null, usuario: null })}>
                Limpar filtros
              </Button>
            )
          )}
        </div>
      )}

      {rows.length > 0 && (
        <>
          {/* Mobile: uma lista num card só, 3 linhas curtas por evento — o cartão por evento com "Quem fez"/"Afetado" em linhas de 44px deixava 50 eventos com metros de altura. */}
          <ol className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface lg:hidden">
            {rows.map((row) => {
              const details = describeAuditMetadata(row.action, row.metadata);
              return (
                <li key={row.id} className="flex flex-col gap-0.5 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-medium text-text-primary">{AUDIT_ACTION_LABELS[row.action]}</span>
                    <time dateTime={row.occurred_at} className="text-xs text-text-secondary">
                      {formatDateTime(row.occurred_at)}
                    </time>
                  </div>
                  {details && <p className="text-xs text-text-secondary">{details}</p>}
                  <p className="text-xs text-text-secondary">
                    Por <Actor row={row} inline /> · afetado: <Target row={row} inline />
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs text-text-secondary">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Data e hora</th>
                  <th scope="col" className="px-3 py-2 font-medium">Ação</th>
                  <th scope="col" className="px-3 py-2 font-medium">Quem fez</th>
                  <th scope="col" className="px-3 py-2 font-medium">Afetado</th>
                  <th scope="col" className="px-3 py-2 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-3 py-3 whitespace-nowrap text-text-secondary">
                      <time dateTime={row.occurred_at}>{formatDateTime(row.occurred_at)}</time>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-text-primary">{AUDIT_ACTION_LABELS[row.action]}</td>
                    <td className="px-3 py-1">
                      <Actor row={row} />
                    </td>
                    <td className="px-3 py-1">
                      <Target row={row} />
                    </td>
                    <td className="px-3 py-3 text-text-secondary">
                      {describeAuditMetadata(row.action, row.metadata) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {logsQuery.data && (
        <Pagination
          page={page}
          pageSize={ADMIN_PAGE_SIZE}
          totalCount={logsQuery.data.totalCount}
          onPageChange={setPage}
          isFetching={logsQuery.isFetching}
        />
      )}
    </div>
  );
}
