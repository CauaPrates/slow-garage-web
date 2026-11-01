import { useRef, useState, type MouseEvent } from "react";
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
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { useDeleteExpense } from "./useExpenses";
import type { ExpenseWithAttachment } from "./useExpenses";

type DeleteExpenseDialogProps = {
  vehicleId: string;
  expense: ExpenseWithAttachment;
  /** Rótulo da categoria do registro (`null` = sem categoria). */
  categoryLabel: string | null;
  /** Registro da categoria de sistema Upgrade: também aparece em Modificações. */
  isUpgrade?: boolean;
  /** Aberto a partir de Modificações: o texto fala em "upgrade". */
  upgradeMode?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois da exclusão confirmada pelo servidor — quem chama cuida do foco quando a linha some. */
  onDeleted?: () => void;
};

/**
 * Etapa 05: o título não depende mais da descrição (vazia dava `Excluir ""?`);
 * o registro aparece num cartão neutro com descrição, categoria, data e
 * valor. As consequências são as que o código garante: o anexo sai antes
 * (`deleteAttachmentIfExists`), os totais e gráficos vêm das views sobre
 * `expenses`, e Modificações lista a categoria Upgrade.
 */
export function DeleteExpenseDialog({
  vehicleId,
  expense,
  categoryLabel,
  isUpgrade = false,
  upgradeMode = false,
  open,
  onOpenChange,
  onDeleted,
}: DeleteExpenseDialogProps) {
  const deleteExpense = useDeleteExpense(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const deletingRef = useRef(false);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    if (deletingRef.current) return;
    deletingRef.current = true;
    setError(null);
    try {
      await deleteExpense.mutateAsync(expense);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  const noun = upgradeMode ? "upgrade" : "gasto";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {noun}?</AlertDialogTitle>
          <AlertDialogDescription>
            Sai da lista e dos totais e gráficos do veículo
            {isUpgrade && !upgradeMode ? ", e também de Modificações" : ""}.
            {expense.attachment ? " O anexo também é apagado." : ""} Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className={expense.description ? "text-sm font-medium break-words text-text-primary" : "text-sm text-text-secondary"}>
              {expense.description || "Sem descrição"}
            </p>
            <p className="text-xs text-text-secondary">
              {categoryLabel ?? "Sem categoria"}
              {expense.occurred_on ? ` · ${formatDateOnly(expense.occurred_on)}` : ""}
            </p>
            {expense.attachment && (
              <p className="text-xs break-all text-text-secondary">Anexo: {expense.attachment.original_filename}</p>
            )}
          </div>
          <p className="shrink-0 font-mono text-sm text-text-primary">{formatMoney(expense.amount)}</p>
        </div>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteExpense.isPending}>
            {deleteExpense.isPending ? "Excluindo…" : `Excluir ${noun}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
