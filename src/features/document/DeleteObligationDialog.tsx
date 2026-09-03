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
import { translatePostgresError } from "@/lib/postgresErrors";
import { useDeleteObligation, type ObligationRow } from "./useObligations";

type DeleteObligationDialogProps = {
  vehicleId: string;
  obligation: ObligationRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** RN da ADR-031: exclusão de verdade, mesmo padrão de item do plano de manutenção. */
export function DeleteObligationDialog({
  vehicleId,
  obligation,
  open,
  onOpenChange,
}: DeleteObligationDialogProps) {
  const deleteObligation = useDeleteObligation(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteObligation.mutateAsync(obligation.id);
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{obligation.label}"?</AlertDialogTitle>
          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteObligation.isPending}>
            {deleteObligation.isPending ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
