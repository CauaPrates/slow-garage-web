import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORM_DIALOG_HEADER_CLASSNAME, focusDialogOnOpen } from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { FinancingForm } from "./FinancingForm";
import { DOCUMENT_FORM_DIALOG_CLASSNAME } from "./CreateDocumentDialog";
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
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: FinancingFormOutput) {
    setError(null);
    try {
      await createFinancing.mutateAsync({
        financed_amount: values.financedAmount ?? null,
        installment_amount: values.installmentAmount ?? null,
        installment_count: values.installmentCount ?? null,
        installments_paid: values.installmentsPaid,
        started_on: values.startedOn,
        interest_rate_monthly: values.interestRateMonthly ?? null,
      });
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={DOCUMENT_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Cadastrar financiamento</DialogTitle>
          <DialogDescription>Um por veículo. Não entra em Gastos nem no total investido.</DialogDescription>
        </DialogHeader>
        <FinancingForm mode="create" onSubmit={handleSubmit} submitLabel="Cadastrar financiamento" submitError={error} />
      </DialogContent>
    </Dialog>
  );
}
