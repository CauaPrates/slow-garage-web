import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { ROUTES } from "@/lib/routes";
import { translateAdminError } from "@/features/admin/errors";
import { useIsAdmin } from "@/features/admin/useIsAdmin";
import {
  INVITE_STATUS_LABELS,
  effectiveInviteStatus,
  useAcceptInvite,
  useDeclineInvite,
  useInvite,
} from "@/features/admin/useInvites";

type InviteResponseProps = {
  inviteId: string | undefined;
  /** Chamado depois de aceitar ou recusar com sucesso (ex.: marcar a notificação como lida). */
  onResolved?: () => void;
  /** Chamado ao seguir o link pro painel (ex.: fechar o popover). */
  onNavigate?: () => void;
};

/**
 * Aceitar/Recusar um convite para admin. Confere o convite no banco antes
 * de mostrar os botões: a notificação continua existindo depois que o
 * convite é cancelado ou expira, e `pending` com `expires_at` vencido
 * conta como expirado (ver `effectiveInviteStatus`).
 */
export function InviteResponse({ inviteId, onResolved, onNavigate }: InviteResponseProps) {
  const inviteQuery = useInvite(inviteId);
  const { data: isAdmin } = useIsAdmin();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();
  const [error, setError] = useState<string | null>(null);

  if (!inviteId) return null;

  if (inviteQuery.isLoading) {
    return <div className="h-11 w-48 animate-pulse rounded-md bg-bg" />;
  }

  if (inviteQuery.isError) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-text-secondary">Não foi possível conferir o convite.</p>
        <Button variant="ghost" className="h-11 px-3 text-xs" onClick={() => inviteQuery.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const invite = inviteQuery.data;
  if (!invite) {
    return <p className="text-xs text-text-secondary">Convite não encontrado.</p>;
  }

  const status = effectiveInviteStatus(invite);

  if (status === "accepted") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-xs text-text-secondary">Convite aceito.</p>
        {isAdmin && (
          <Link
            to={ROUTES.admin}
            onClick={onNavigate}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Ir para o painel
          </Link>
        )}
      </div>
    );
  }

  if (status !== "pending") {
    return <p className="text-xs text-text-secondary">Convite {INVITE_STATUS_LABELS[status].toLowerCase()}.</p>;
  }

  const busy = accept.isPending || decline.isPending;

  async function respond(action: "accept" | "decline") {
    if (!invite) return;
    setError(null);
    try {
      await (action === "accept" ? accept : decline).mutateAsync(invite.id);
      onResolved?.();
    } catch (mutationError) {
      setError(translateAdminError(mutationError));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button className="h-11 px-4" disabled={busy} onClick={() => respond("accept")}>
          {accept.isPending ? "Aceitando…" : "Aceitar"}
        </Button>
        <Button variant="outline" className="h-11 px-4" disabled={busy} onClick={() => respond("decline")}>
          {decline.isPending ? "Recusando…" : "Recusar"}
        </Button>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
