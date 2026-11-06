import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentField } from "@/features/attachment/AttachmentField";
import {
  FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { EXPENSE_FORM_DIALOG_CLASSNAME } from "./CreateExpenseDialog";
import { ExpenseForm } from "./ExpenseForm";
import { useUpdateExpense } from "./useExpenses";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseFormInput, ExpenseFormOutput } from "./schemas";
import type { ExpenseWithAttachment } from "./useExpenses";

type EditExpenseDialogProps = {
  vehicleId: string;
  upgradeCategoryId?: string;
  expense: ExpenseWithAttachment;
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(expense: ExpenseWithAttachment): Partial<ExpenseFormInput> {
  return {
    categoryId: expense.category_id ?? undefined,
    amount: String(expense.amount),
    description: expense.description ?? undefined,
    occurredOn: expense.occurred_on ?? undefined,
    odometerKm: expense.odometer_km != null ? String(expense.odometer_km) : undefined,
    vendor: expense.vendor ?? undefined,
    paymentMethod: expense.payment_method ?? undefined,
    notes: expense.notes ?? undefined,
  };
}

/**
 * Os valores iniciais só entram na montagem (`useForm`): a lista recarregar
 * com o diálogo aberto — por exemplo depois de anexar um arquivo — atualiza
 * o anexo, mas não sobrescreve o que está sendo digitado.
 */
export function EditExpenseDialog({
  vehicleId,
  upgradeCategoryId,
  expense,
  categories,
  open,
  onOpenChange,
}: EditExpenseDialogProps) {
  const updateExpense = useUpdateExpense(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: ExpenseFormOutput) {
    setError(null);
    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        category_id: upgradeCategoryId ?? values.categoryId ?? null,
        amount: values.amount,
        description: values.description ?? null,
        occurred_on: values.occurredOn,
        odometer_km: values.odometerKm ?? null,
        vendor: values.vendor ?? null,
        payment_method: values.paymentMethod ?? null,
        notes: values.notes ?? null,
      });
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  // Qual registro está sendo editado: descrição (ou a falta dela), data e valor salvos.
  const identity = [
    expense.description || "Sem descrição",
    expense.occurred_on ? formatDateOnly(expense.occurred_on) : null,
    formatMoney(expense.amount),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={EXPENSE_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>{upgradeCategoryId ? "Editar upgrade" : "Editar gasto"}</DialogTitle>
          <DialogDescription className="break-words">{identity}</DialogDescription>
        </DialogHeader>
        <ExpenseForm
          mode="edit"
          categories={categories}
          upgrade={!!upgradeCategoryId}
          defaultValues={toFormDefaults(expense)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
          attachment={
            <AttachmentField
              vehicleId={vehicleId}
              entityType="expense"
              entityId={expense.id}
              attachment={expense.attachment}
            />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
