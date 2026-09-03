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
import { useCreateProject } from "./useProjects";
import type { ProjectFormOutput } from "./schemas";

type CreateProjectDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({ vehicleId, open, onOpenChange }: CreateProjectDialogProps) {
  const createProject = useCreateProject(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ProjectFormOutput) {
    setError(null);
    try {
      await createProject.mutateAsync({
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
          <DialogTitle>Novo projeto</DialogTitle>
        </DialogHeader>
        <ProjectForm mode="create" onSubmit={handleSubmit} submitLabel="Criar projeto" />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
