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
import { useUpdateIssue } from "./useIssues";
import type { IssueFormInput, IssueFormOutput } from "./schemas";
import type { IssueRow } from "./useIssues";

type EditIssueDialogProps = {
  vehicleId: string;
  issue: IssueRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(issue: IssueRow): Partial<IssueFormInput> {
  return {
    title: issue.title,
    reportedOn: issue.reported_on,
    priority: issue.priority,
    status: issue.status,
    description: issue.description ?? undefined,
    diagnosis: issue.diagnosis ?? undefined,
    resolution: issue.resolution ?? undefined,
    resolvedOn: issue.resolved_on ?? undefined,
    odometerKm: issue.odometer_km != null ? String(issue.odometer_km) : undefined,
    cost: issue.cost != null ? String(issue.cost) : undefined,
  };
}

export function EditIssueDialog({ vehicleId, issue, open, onOpenChange }: EditIssueDialogProps) {
  const updateIssue = useUpdateIssue(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: IssueFormOutput) {
    setError(null);
    try {
      await updateIssue.mutateAsync({
        id: issue.id,
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
          <DialogTitle>Editar problema</DialogTitle>
        </DialogHeader>
        <IssueForm
          mode="edit"
          defaultValues={toFormDefaults(issue)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
