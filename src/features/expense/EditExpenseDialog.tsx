import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { AttachmentField } from "@/features/attachment/AttachmentField";
import { ExpenseForm } from "./ExpenseForm";
import { useUpdateExpense } from "./useExpenses";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseFormInput, ExpenseFormOutput } from "./schemas";
import type { ExpenseWithAttachment } from "./useExpenses";

type EditExpenseDialogProps = {
  vehicleId: string;
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

export function EditExpenseDialog({
  vehicleId,
  expense,
  categories,
  open,
  onOpenChange,
}: EditExpenseDialogProps) {
  const updateExpense = useUpdateExpense(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ExpenseFormOutput) {
    setError(null);
    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        category_id: values.categoryId ?? null,
        amount: values.amount,
        description: values.description ?? null,
        occurred_on: values.occurredOn,
        odometer_km: values.odometerKm ?? null,
        vendor: values.vendor ?? null,
        payment_method: values.paymentMethod ?? null,
        notes: values.notes ?? null,
      });
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar gasto</DialogTitle>
        </DialogHeader>
        <ExpenseForm
          mode="edit"
          categories={categories}
          defaultValues={toFormDefaults(expense)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        >
          <AttachmentField
            vehicleId={vehicleId}
            entityType="expense"
            entityId={expense.id}
            attachment={expense.attachment}
          />
        </ExpenseForm>
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
