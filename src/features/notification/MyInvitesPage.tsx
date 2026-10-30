import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { useIsAdmin } from "@/features/admin/useIsAdmin";
import { useMyPendingInvites } from "@/features/admin/useInvites";
import { InviteResponse } from "./InviteResponse";

/**
 * "Meus convites": os convites para admin pendentes e ainda válidos que
 * o usuário logado recebeu — caminho de volta pra quem apagou a
 * notificação. O e-mail do convite não tem link de aceite; o aceite é
 * sempre aqui ou pela notificação, logado.
 */
export function MyInvitesPage() {
  const invitesQuery = useMyPendingInvites();
  // Depois do aceite o convite sai da lista de pendentes — o caminho pro painel fica aqui.
  const { data: isAdmin } = useIsAdmin();
  const invites = invitesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-medium text-text-primary">Meus convites</h1>
        <p className="text-sm text-text-secondary">Convites para virar Administrador Gearhead.</p>
      </div>

      {isAdmin && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-2"
        >
          <p className="text-sm text-text-primary">Você é Administrador Gearhead.</p>
          <Link
            to={ROUTES.admin}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Ir para o painel
          </Link>
        </div>
      )}

      {invitesQuery.isLoading && (
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      )}

      {invitesQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar seus convites.</p>
          <Button variant="ghost" onClick={() => invitesQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {invitesQuery.data && invites.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text-secondary">
          Nenhum convite pendente. Quando um administrador te convidar, o convite aparece aqui e nas suas
          notificações.
        </p>
      )}

      {invites.length > 0 && (
        <ul className="flex flex-col gap-3">
          {invites.map((invite) => (
            <li key={invite.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-text-primary">Convite para ser Administrador Gearhead</p>
                <p className="text-xs text-text-secondary">
                  Recebido em {formatDateTime(invite.created_at)} · vale até {formatDateTime(invite.expires_at)}
                </p>
              </div>
              <InviteResponse inviteId={invite.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
