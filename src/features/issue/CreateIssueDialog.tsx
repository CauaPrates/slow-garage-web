import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { IssueForm } from "./IssueForm";
import { useCreateIssue } from "./useIssues";
import type { IssueFormOutput } from "./schemas";

type CreateIssueDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateIssueDialog({ vehicleId, open, onOpenChange }: CreateIssueDialogProps) {
  const createIssue = useCreateIssue(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: IssueFormOutput) {
    setError(null);
    try {
      await createIssue.mutateAsync({
        title: values.title,
        reported_on: values.reportedOn,
        priority: values.priority,
        status: values.status,
        description: values.description ?? null,
        diagnosis: values.diagnosis ?? null,
        resolution: values.resolution ?? null,
        resolved_on: values.resolvedOn ?? null,
        odometer_km: values.odometerKm ?? null,
        cost: values.cost ?? null,
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
          <DialogTitle>Relatar problema</DialogTitle>
        </DialogHeader>
        <IssueForm mode="create" onSubmit={handleSubmit} submitLabel="Relatar problema" />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
