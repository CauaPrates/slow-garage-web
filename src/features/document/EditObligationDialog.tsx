import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { ObligationForm } from "./ObligationForm";
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

export function EditObligationDialog({
  vehicleId,
  obligation,
  open,
  onOpenChange,
}: EditObligationDialogProps) {
  const updateObligation = useUpdateObligation(vehicleId);
  const [error, setError] = useState<string | null>(null);

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
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar obrigação</DialogTitle>
        </DialogHeader>
        <ObligationForm
          mode="edit"
          defaultValues={toFormDefaults(obligation)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
