import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { PROJECT_FORM_DIALOG_CLASSNAME } from "./CreateProjectDialog";
import { ProjectForm } from "./ProjectForm";
import { useUpdateProject } from "./useProjects";
import { PROJECT_STATUS_LABELS, type ProjectFormInput, type ProjectFormOutput } from "./schemas";
import type { ProjectWithProgress } from "./useProjects";

type EditProjectDialogProps = {
  vehicleId: string;
  project: ProjectWithProgress;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Depois de salvar: o status gravado (a lista decide pra onde o foco vai se a linha trocou de grupo). */
  onSaved?: (status: ProjectFormOutput["status"]) => void;
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

/**
 * Etapa 09: "Editar projeto" com qual registro está aberto na descrição.
 * Quem abre guarda o projeto (a linha da lista pode trocar de grupo e
 * desmontar quando a lista recarrega). Valores iniciais só na montagem: o
 * refetch não sobrescreve o que está digitado. Payload igual.
 */
export function EditProjectDialog({ vehicleId, project, open, onOpenChange, onSaved }: EditProjectDialogProps) {
  const updateProject = useUpdateProject(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

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
      onSaved?.(values.status);
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={PROJECT_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Editar projeto</DialogTitle>
          <DialogDescription className="break-words">
            {project.name} · {PROJECT_STATUS_LABELS[project.status]}
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          mode="edit"
          defaultValues={toFormDefaults(project)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
