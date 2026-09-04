import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { translatePostgresError } from "@/lib/postgresErrors";
import { FieldError } from "@/components/ui/field-error";
import { useState } from "react";
import { ExpenseForm } from "./ExpenseForm";
import { useCreateExpense } from "./useExpenses";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseFormOutput } from "./schemas";

type CreateExpenseDialogProps = {
  vehicleId: string;
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  defaultOdometerKm?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Sem campo de anexo (RN-1) — o gasto ainda não tem id até este diálogo
 * salvar. Sem `DialogTrigger` próprio de propósito: `open`/`onOpenChange`
 * são inteiramente controlados por quem renderiza (a página tem mais de
 * um botão de entrada — cabeçalho, estado vazio, `?novo=1` — todos
 * abrindo a mesma instância).
 */
export function CreateExpenseDialog({
  vehicleId,
  categories,
  defaultOdometerKm,
  open,
  onOpenChange,
}: CreateExpenseDialogProps) {
  const createExpense = useCreateExpense(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ExpenseFormOutput) {
    setError(null);
    try {
      await createExpense.mutateAsync({
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
          <DialogTitle>Registrar gasto</DialogTitle>
        </DialogHeader>
        <ExpenseForm
          mode="create"
          categories={categories}
          defaultValues={
            defaultOdometerKm !== undefined
              ? { odometerKm: String(defaultOdometerKm) }
              : undefined
          }
          onSubmit={handleSubmit}
          submitLabel="Registrar gasto"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
