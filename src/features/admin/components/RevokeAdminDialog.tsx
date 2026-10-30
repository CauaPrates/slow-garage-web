import { useState, type MouseEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/ui/field-error";
import { translateAdminError } from "../errors";
import { useRevokeAdminRole } from "../useAdmin";

type RevokeAdminDialogProps = {
  userId: string;
  userLabel: string;
  isSelf: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevoked: () => void;
};

/**
 * Confirmação de `admin_revoke_admin_role`. Pode ser o próprio usuário:
 * nesse caso o recheck de `is_admin` (feito pela mutation) tira a pessoa
 * do painel logo depois. O último admin é recusado pelo banco
 * (`last_admin`) e a mensagem aparece aqui, sem fechar o diálogo.
 */
export function RevokeAdminDialog({
  userId,
  userLabel,
  isSelf,
  open,
  onOpenChange,
  onRevoked,
}: RevokeAdminDialogProps) {
  const revoke = useRevokeAdminRole();
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    setError(null);
    try {
      await revoke.mutateAsync(userId);
      onOpenChange(false);
      onRevoked();
    } catch (mutationError) {
      setError(translateAdminError(mutationError));
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isSelf ? "Deixar de ser administrador?" : `Remover ${userLabel} dos administradores?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {isSelf
              ? "Você volta a ser Gearhead e perde o acesso ao painel na hora. Para voltar, outro administrador precisa te convidar."
              : "A pessoa volta a ser Gearhead e perde o acesso ao painel na hora. Para voltar, precisa de um novo convite."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={revoke.isPending}>
            {revoke.isPending ? "Removendo…" : "Remover admin"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
