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
import { useDeleteFinancing, type FinancingRow } from "./useFinancing";

type DeleteFinancingDialogProps = {
  vehicleId: string;
  financing: FinancingRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteFinancingDialog({
  vehicleId,
  financing,
  open,
  onOpenChange,
}: DeleteFinancingDialogProps) {
  const deleteFinancing = useDeleteFinancing(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteFinancing.mutateAsync(financing.id);
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir financiamento?</AlertDialogTitle>
          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteFinancing.isPending}>
            {deleteFinancing.isPending ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
