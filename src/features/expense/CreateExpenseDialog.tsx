import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FORM_DIALOG_CLASSNAME,
  FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ExpenseForm } from "./ExpenseForm";
import { useCreateExpense } from "./useExpenses";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseFormOutput } from "./schemas";

type CreateExpenseDialogProps = {
  vehicleId: string;
  upgradeCategoryId?: string;
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  defaultOdometerKm?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Etapa 05: a casca do formulário do veículo (cabeçalho e rodapé fixos, só o corpo rola), mais estreita — o gasto tem menos campos. */
export const EXPENSE_FORM_DIALOG_CLASSNAME = cn(FORM_DIALOG_CLASSNAME, "max-w-xl");

/**
 * Sem campo de anexo (RN-1) — o gasto ainda não tem id até este diálogo
 * salvar. Sem `DialogTrigger` próprio de propósito: `open`/`onOpenChange`
 * são inteiramente controlados por quem renderiza (a página tem mais de
 * um botão de entrada — cabeçalho, estado vazio, `?novo=1` — todos
 * abrindo a mesma instância).
 */
export function CreateExpenseDialog({
  vehicleId,
  upgradeCategoryId,
  categories,
  defaultOdometerKm,
  open,
  onOpenChange,
}: CreateExpenseDialogProps) {
  const createExpense = useCreateExpense(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    // O formulário desmonta ao fechar; o erro do envio anterior vai junto.
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: ExpenseFormOutput) {
    setError(null);
    try {
      await createExpense.mutateAsync({
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

  const title = upgradeCategoryId ? "Registrar upgrade" : "Registrar gasto";

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {upgradeCategoryId
              ? "Peça, acerto ou modificação. Entra também nos gastos do veículo."
              : "Lançamento avulso deste veículo. Abastecimento e manutenção têm registro próprio."}
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm
          mode="create"
          categories={categories}
          upgrade={!!upgradeCategoryId}
          defaultValues={
            { categoryId: upgradeCategoryId, ...(defaultOdometerKm !== undefined ? { odometerKm: String(defaultOdometerKm) } : {}) }
          }
          onSubmit={handleSubmit}
          submitLabel={title}
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
