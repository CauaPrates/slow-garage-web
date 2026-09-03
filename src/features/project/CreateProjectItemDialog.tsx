import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { ProjectItemForm, type ProjectOption } from "./ProjectItemForm";
import { useCreateProjectItem } from "./useProjectItems";
import type { ProjectItemFormOutput } from "./schemas";

type CreateProjectItemDialogProps = {
  vehicleId: string;
  projects: ProjectOption[];
  fixedProjectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Usado tanto no detalhe do projeto (`fixedProjectId`) quanto no atalho "Upgrade" (projeto escolhido no formulário). */
export function CreateProjectItemDialog({
  vehicleId,
  projects,
  fixedProjectId,
  open,
  onOpenChange,
}: CreateProjectItemDialogProps) {
  const createItem = useCreateProjectItem(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ProjectItemFormOutput) {
    setError(null);
    try {
      await createItem.mutateAsync({
        project_id: values.projectId,
        name: values.name,
        status: values.status,
        priority: values.priority,
        vendor: values.vendor ?? null,
        external_url: values.externalUrl ?? null,
        estimated_cost: values.estimatedCost ?? null,
        actual_cost: values.actualCost ?? null,
        occurred_on: values.occurredOn ?? null,
        description: values.description ?? null,
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
          <DialogTitle>Adicionar item</DialogTitle>
        </DialogHeader>
        <ProjectItemForm
          mode="create"
          projects={projects}
          fixedProjectId={fixedProjectId}
          onSubmit={handleSubmit}
          submitLabel="Adicionar item"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
