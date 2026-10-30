import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { translateAdminError } from "../errors";
import { useRevokeInvite } from "../useAdmin";

/** Cancela um convite pendente (`admin_revoke_invite`). Não existe "reenviar e-mail": pra isso, cancela e convida de novo. */
export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const revoke = useRevokeInvite();
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    try {
      await revoke.mutateAsync(inviteId);
    } catch (mutationError) {
      setError(translateAdminError(mutationError));
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" className="px-3" disabled={revoke.isPending} onClick={handleClick}>
        {revoke.isPending ? "Cancelando…" : "Cancelar convite"}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  );
}
