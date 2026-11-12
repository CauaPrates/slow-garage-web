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

/**
 * Usado no detalhe do projeto (`fixedProjectId`, projeto travado) e no
 * `?novo=1` da lista (projeto escolhido no formulário). Etapa 09: casca nova,
 * foco no diálogo ao abrir e de volta a quem abriu; payload igual. Nada é
 * criado em Gastos — o item fica só no projeto.
 */
export function CreateProjectItemDialog({
  vehicleId,
  projects,
  fixedProjectId,
  open,
  onOpenChange,
}: CreateProjectItemDialogProps) {
  const createItem = useCreateProjectItem(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();
  const fixedName = fixedProjectId ? projects.find((p) => p.id === fixedProjectId)?.name : undefined;

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

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
          <DialogTitle>Adicionar item</DialogTitle>
          <DialogDescription className="break-words">
            {fixedName
              ? `Em ${fixedName}. Só o nome é obrigatório.`
              : "Peça, serviço ou ideia de um projeto. Projeto e nome são obrigatórios."}
          </DialogDescription>
        </DialogHeader>
        <ProjectItemForm
          mode="create"
          projects={projects}
          fixedProjectId={fixedProjectId}
          onSubmit={handleSubmit}
          submitLabel="Adicionar item"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
