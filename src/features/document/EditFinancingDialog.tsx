import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORM_DIALOG_HEADER_CLASSNAME, focusDialogOnOpen } from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { FinancingForm } from "./FinancingForm";
import { DOCUMENT_FORM_DIALOG_CLASSNAME } from "./CreateDocumentDialog";
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
    financedAmount: financing.financed_amount != null ? String(financing.financed_amount) : undefined,
    installmentAmount: financing.installment_amount != null ? String(financing.installment_amount) : undefined,
    installmentCount: financing.installment_count != null ? String(financing.installment_count) : undefined,
    installmentsPaid: String(financing.installments_paid),
    startedOn: financing.started_on ?? undefined,
    interestRateMonthly:
      financing.interest_rate_monthly != null ? String(financing.interest_rate_monthly) : undefined,
  };
}

/** AC-15: é o único lugar (além do botão "Registrar parcela paga") que corrige `installments_paid`. */
export function EditFinancingDialog({ vehicleId, financing, open, onOpenChange }: EditFinancingDialogProps) {
  const updateFinancing = useUpdateFinancing(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

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
          <DialogTitle>Editar financiamento</DialogTitle>
          <DialogDescription>Contrato e contagem de parcelas pagas. Parcelas restantes e o valor delas são recalculados.</DialogDescription>
        </DialogHeader>
        <FinancingForm
          mode="edit"
          defaultValues={toFormDefaults(financing)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
