import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { ProjectForm } from "./ProjectForm";
import { useUpdateProject } from "./useProjects";
import type { ProjectFormInput, ProjectFormOutput } from "./schemas";
import type { ProjectWithProgress } from "./useProjects";

type EditProjectDialogProps = {
  vehicleId: string;
  project: ProjectWithProgress;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(project: ProjectWithProgress): Partial<ProjectFormInput> {
  return {
    name: project.name,
    status: project.status,
    budget: project.budget != null ? String(project.budget) : undefined,
    description: project.description ?? undefined,
    notes: project.notes ?? undefined,
    startedOn: project.started_on ?? undefined,
    targetDate: project.target_date ?? undefined,
    completedOn: project.completed_on ?? undefined,
  };
}

export function EditProjectDialog({
  vehicleId,
  project,
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  const updateProject = useUpdateProject(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ProjectFormOutput) {
    setError(null);
    try {
      await updateProject.mutateAsync({
        id: project.id,
        name: values.name,
        status: values.status,
        budget: values.budget ?? null,
        description: values.description ?? null,
        notes: values.notes ?? null,
        started_on: values.startedOn ?? null,
        target_date: values.targetDate ?? null,
        completed_on: values.completedOn ?? null,
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
          <DialogTitle>Editar projeto</DialogTitle>
        </DialogHeader>
        <ProjectForm
          mode="edit"
          defaultValues={toFormDefaults(project)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
