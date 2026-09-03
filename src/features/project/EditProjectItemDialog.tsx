import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { ProjectItemForm } from "./ProjectItemForm";
import { useUpdateProjectItem } from "./useProjectItems";
import type { ProjectItemFormInput, ProjectItemFormOutput } from "./schemas";
import type { ProjectItemRow } from "./useProjectItems";

type EditProjectItemDialogProps = {
  item: ProjectItemRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(item: ProjectItemRow): Partial<ProjectItemFormInput> {
  return {
    projectId: item.project_id,
    name: item.name,
    status: item.status,
    priority: item.priority,
    vendor: item.vendor ?? undefined,
    externalUrl: item.external_url ?? undefined,
    estimatedCost: item.estimated_cost != null ? String(item.estimated_cost) : undefined,
    actualCost: item.actual_cost != null ? String(item.actual_cost) : undefined,
    occurredOn: item.occurred_on ?? undefined,
    description: item.description ?? undefined,
    notes: item.notes ?? undefined,
  };
}

/** O projeto do item é fixo na edição (select desabilitado, uma opção) — mudar de projeto não é um caso previsto. */
export function EditProjectItemDialog({
  item,
  open,
  onOpenChange,
}: EditProjectItemDialogProps) {
  const updateItem = useUpdateProjectItem();
  const [error, setError] = useState<string | null>(null);
  const projectOptions = [{ id: item.project_id, name: "Este projeto" }];

  async function handleSubmit(values: ProjectItemFormOutput) {
    setError(null);
    try {
      await updateItem.mutateAsync({
        id: item.id,
        projectId: item.project_id,
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
          <DialogTitle>Editar item</DialogTitle>
        </DialogHeader>
        <ProjectItemForm
          mode="edit"
          projects={projectOptions}
          fixedProjectId={item.project_id}
          defaultValues={toFormDefaults(item)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
