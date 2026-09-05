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
import { useDeleteExpense } from "./useExpenses";
import type { ExpenseWithAttachment } from "./useExpenses";

type DeleteExpenseDialogProps = {
  vehicleId: string;
  expense: ExpenseWithAttachment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteExpenseDialog({
  vehicleId,
  expense,
  open,
  onOpenChange,
}: DeleteExpenseDialogProps) {
  const deleteExpense = useDeleteExpense(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteExpense.mutateAsync(expense);
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{expense.description}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita.
            {expense.attachment ? " O anexo também será apagado." : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteExpense.isPending}>
            {deleteExpense.isPending ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
