import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORM_DIALOG_HEADER_CLASSNAME, focusDialogOnOpen } from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { ObligationForm } from "./ObligationForm";
import { DOCUMENT_FORM_DIALOG_CLASSNAME } from "./CreateDocumentDialog";
import { useUpdateObligation, type ObligationRow } from "./useObligations";
import type { ObligationFormInput, ObligationFormOutput } from "./schemas";

type EditObligationDialogProps = {
  vehicleId: string;
  obligation: ObligationRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(obligation: ObligationRow): Partial<ObligationFormInput> {
  return {
    kind: obligation.kind,
    label: obligation.label,
    dueOn: obligation.due_on ?? undefined,
    amount: obligation.amount != null ? String(obligation.amount) : undefined,
    provider: obligation.provider ?? undefined,
    notes: obligation.notes ?? undefined,
    paidOn: obligation.paid_on ?? undefined,
  };
}

export function EditObligationDialog({ vehicleId, obligation, open, onOpenChange }: EditObligationDialogProps) {
  const updateObligation = useUpdateObligation(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: ObligationFormOutput) {
    setError(null);
    try {
      await updateObligation.mutateAsync({
        id: obligation.id,
        kind: values.kind,
        label: values.label,
        due_on: values.dueOn ?? null,
        amount: values.amount ?? null,
        provider: values.provider ?? null,
        notes: values.notes ?? null,
        paid_on: values.paidOn ?? null,
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
          <DialogTitle>Editar obrigação</DialogTitle>
          <DialogDescription className="break-words">{obligation.label}</DialogDescription>
        </DialogHeader>
        <ObligationForm
          mode="edit"
          defaultValues={toFormDefaults(obligation)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
