import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { InviteStatusBadge } from "./components/AdminBadges";
import { RevokeInviteButton } from "./components/RevokeInviteButton";
import { UserLink } from "./components/UserLink";
import { INVITE_STATUS_LABELS, effectiveInviteStatus, type AdminInviteStatus } from "./useInvites";
import { useAdminInvites, type InviteStatusFilter } from "./useAdmin";
import { useAdminListParams } from "./useAdminListParams";

const STATUS_OPTIONS = Object.entries(INVITE_STATUS_LABELS) as [AdminInviteStatus, string][];

function parseStatus(value: string | null): InviteStatusFilter {
  return value && value in INVITE_STATUS_LABELS ? (value as AdminInviteStatus) : "all";
}

/** Todos os convites (admin vê todos pela RLS). Pendente vencido aparece e filtra como "Expirado". */
export function AdminInvitesPage() {
  const { params, setFilters } = useAdminListParams();
  const status = parseStatus(params.get("status"));
  const invitesQuery = useAdminInvites(status);
  const invites = invitesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-medium text-text-primary">Convites</h1>

      <div className="flex flex-col gap-1.5 sm:w-60">
        <Label htmlFor="admin-invites-status">Status</Label>
        <Select
          id="admin-invites-status"
          value={status}
          onChange={(event) => setFilters({ status: event.target.value === "all" ? null : event.target.value })}
        >
          <option value="all">Todos</option>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {invitesQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {invitesQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar os convites.</p>
          <Button variant="ghost" onClick={() => invitesQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {invitesQuery.data && invites.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-secondary">
            {status === "all"
              ? "Nenhum convite enviado ainda. Para convidar, abra um usuário na lista de usuários."
              : "Nenhum convite com esse status."}
          </p>
          {status !== "all" && (
            <Button variant="ghost" onClick={() => setFilters({ status: null })}>
              Ver todos
            </Button>
          )}
        </div>
      )}

      {invites.length > 0 && (
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <InviteStatusBadge invite={invite} />
                  <span className="text-text-secondary">Convidado:</span>
                  <UserLink userId={invite.invitee_id} />
                </div>
                <p className="text-text-secondary">
                  Por <UserLink userId={invite.invited_by} fallback="conta excluída" inline /> em{" "}
                  {formatDateTime(invite.created_at)} · vale até {formatDateTime(invite.expires_at)}
                  {invite.resolved_at && ` · resolvido em ${formatDateTime(invite.resolved_at)}`}
                  {" · "}
                  {invite.email_sent_at ? "e-mail enviado" : "sem e-mail"}
                </p>
              </div>
              {effectiveInviteStatus(invite) === "pending" && <RevokeInviteButton inviteId={invite.id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
