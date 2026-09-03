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
import { useCreateFinancing } from "./useFinancing";
import type { FinancingFormOutput } from "./schemas";

type CreateFinancingDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** RN-2: só é oferecido quando o veículo ainda não tem financiamento (checado por quem renderiza este diálogo). */
export function CreateFinancingDialog({ vehicleId, open, onOpenChange }: CreateFinancingDialogProps) {
  const createFinancing = useCreateFinancing(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: FinancingFormOutput) {
    setError(null);
    try {
      await createFinancing.mutateAsync({
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
          <DialogTitle>Cadastrar financiamento</DialogTitle>
        </DialogHeader>
        <FinancingForm mode="create" onSubmit={handleSubmit} submitLabel="Salvar financiamento" />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
