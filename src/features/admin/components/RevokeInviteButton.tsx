import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { translateAdminError } from "../errors";
import { useRevokeInvite } from "../useAdmin";

type RevokeInviteButtonProps = {
  inviteId: string;
  /** Nome acessível completo ("Cancelar convite de Bruno Lima") — o visível é só "Cancelar convite". */
  accessibleLabel?: string;
  /** Depois do sucesso o botão some (o convite deixa de ser pendente): quem usa mostra o retorno e leva o foco até ele. */
  onRevoked?: () => void;
};

/**
 * Cancela um convite pendente (`admin_revoke_invite`). Não existe "reenviar
 * e-mail": pra isso, cancela e convida de novo.
 *
 * Etapa 16: trava em `ref` (dois cliques → uma RPC) e `aria-disabled` com
 * "Cancelando…" — com `disabled`, o foco caía no `<body>` durante o envio. A
 * falha aparece logo abaixo e o foco fica no botão.
 */
export function RevokeInviteButton({ inviteId, accessibleLabel, onRevoked }: RevokeInviteButtonProps) {
  const revoke = useRevokeInvite();
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);

  async function handleClick() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    try {
      await revoke.mutateAsync(inviteId);
      onRevoked?.();
    } catch (mutationError) {
      setError(translateAdminError(mutationError));
    } finally {
      sendingRef.current = false;
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        variant="outline"
        aria-label={revoke.isPending ? undefined : accessibleLabel}
        aria-disabled={revoke.isPending || undefined}
        onClick={handleClick}
      >
        {revoke.isPending && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
        {revoke.isPending ? "Cancelando…" : "Cancelar convite"}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  );
}
