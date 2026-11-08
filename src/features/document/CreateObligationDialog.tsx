import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORM_DIALOG_HEADER_CLASSNAME, focusDialogOnOpen } from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { ObligationForm } from "./ObligationForm";
import { DOCUMENT_FORM_DIALOG_CLASSNAME } from "./CreateDocumentDialog";
import { useCreateObligation } from "./useObligations";
import type { ObligationFormOutput } from "./schemas";

type CreateObligationDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateObligationDialog({ vehicleId, open, onOpenChange }: CreateObligationDialogProps) {
  const createObligation = useCreateObligation(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: ObligationFormOutput) {
    setError(null);
    try {
      await createObligation.mutateAsync({
        kind: values.kind,
        label: values.label,
        due_on: values.dueOn ?? null,
        amount: values.amount ?? null,
        provider: values.provider ?? null,
        notes: values.notes ?? null,
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
          <DialogTitle>Registrar obrigação</DialogTitle>
          <DialogDescription>IPVA, licenciamento, seguro, vistoria: um pagamento com prazo deste veículo.</DialogDescription>
        </DialogHeader>
        <ObligationForm mode="create" onSubmit={handleSubmit} submitLabel="Registrar obrigação" submitError={error} />
      </DialogContent>
    </Dialog>
  );
}
