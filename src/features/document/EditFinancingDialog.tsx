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
    financedAmount:
      financing.financed_amount != null ? String(financing.financed_amount) : undefined,
    installmentAmount:
      financing.installment_amount != null ? String(financing.installment_amount) : undefined,
    installmentCount:
      financing.installment_count != null ? String(financing.installment_count) : undefined,
    installmentsPaid: String(financing.installments_paid),
    startedOn: financing.started_on ?? undefined,
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
        financed_amount: values.financedAmount ?? null,
        installment_amount: values.installmentAmount ?? null,
        installment_count: values.installmentCount ?? null,
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
