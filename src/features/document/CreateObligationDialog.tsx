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
import { useCreateObligation } from "./useObligations";
import type { ObligationFormOutput } from "./schemas";

type CreateObligationDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateObligationDialog({
  vehicleId,
  open,
  onOpenChange,
}: CreateObligationDialogProps) {
  const createObligation = useCreateObligation(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ObligationFormOutput) {
    setError(null);
    try {
      await createObligation.mutateAsync({
        kind: values.kind,
        label: values.label,
        due_on: values.dueOn,
        amount: values.amount ?? null,
        provider: values.provider ?? null,
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
          <DialogTitle>Nova obrigação</DialogTitle>
        </DialogHeader>
        <ObligationForm mode="create" onSubmit={handleSubmit} submitLabel="Salvar obrigação" />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
