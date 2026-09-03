import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { FinancingForm } from "./FinancingForm";
import { useUpdateFinancing, type FinancingRow } from "./useFinancing";
import type { FinancingFormInput, FinancingFormOutput } from "./schemas";

type EditFinancingDialogProps = {
  vehicleId: string;
  financing: FinancingRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(financing: FinancingRow): Partial<FinancingFormInput> {
  return {
    financedAmount: String(financing.financed_amount),
    installmentAmount: String(financing.installment_amount),
    installmentCount: String(financing.installment_count),
    installmentsPaid: String(financing.installments_paid),
    startedOn: financing.started_on,
    interestRateMonthly:
      financing.interest_rate_monthly != null ? String(financing.interest_rate_monthly) : undefined,
  };
}

/** AC-15: é o único lugar (além do botão "+1 parcela paga") que corrige `installments_paid`. */
export function EditFinancingDialog({
  vehicleId,
  financing,
  open,
  onOpenChange,
}: EditFinancingDialogProps) {
  const updateFinancing = useUpdateFinancing(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: FinancingFormOutput) {
    setError(null);
    try {
      await updateFinancing.mutateAsync({
        id: financing.id,
        financed_amount: values.financedAmount,
        installment_amount: values.installmentAmount,
        installment_count: values.installmentCount,
        installments_paid: values.installmentsPaid,
        started_on: values.startedOn,
        interest_rate_monthly: values.interestRateMonthly ?? null,
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
          <DialogTitle>Editar financiamento</DialogTitle>
        </DialogHeader>
        <FinancingForm
          mode="edit"
          defaultValues={toFormDefaults(financing)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
