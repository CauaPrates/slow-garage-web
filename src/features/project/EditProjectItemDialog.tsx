import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentField } from "@/features/attachment/AttachmentField";
import {
  VEHICLE_FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/features/vehicle/VehicleFormParts";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { PROJECT_FORM_DIALOG_CLASSNAME } from "./CreateProjectDialog";
import { ProjectItemForm } from "./ProjectItemForm";
import { useUpdateProjectItem } from "./useProjectItems";
import { PROJECT_ITEM_STATUS_LABELS, type ProjectItemFormInput, type ProjectItemFormOutput } from "./schemas";
import type { ProjectItemRow } from "./useProjectItems";

type EditProjectItemDialogProps = {
  item: ProjectItemRow;
  /** Nome do projeto do item, mostrado no seletor travado (antes "Este projeto"). */
  projectName: string;
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

/**
 * O projeto do item é fixo na edição (select desabilitado, uma opção) — mudar
 * de projeto não é um caso previsto, e o PATCH continua filtrando pelo
 * `project_id` salvo. Etapa 09: casca nova e o anexo no fim do corpo
 * (`AttachmentField`, fluxo da etapa 05, mesma invalidação extra de antes).
 * A página guarda o item aberto; valores iniciais só na montagem.
 */
export function EditProjectItemDialog({ item, projectName, open, onOpenChange }: EditProjectItemDialogProps) {
  const updateItem = useUpdateProjectItem();
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();
  const projectOptions = [{ id: item.project_id, name: projectName }];

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

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
        <DialogHeader className={VEHICLE_FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Editar item</DialogTitle>
          <DialogDescription className="break-words">
            {item.name} · {PROJECT_ITEM_STATUS_LABELS[item.status]}
          </DialogDescription>
        </DialogHeader>
        <ProjectItemForm
          mode="edit"
          projects={projectOptions}
          fixedProjectId={item.project_id}
          defaultValues={toFormDefaults(item)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
          attachment={
            <AttachmentField
              vehicleId={item.vehicle_id}
              entityType="project_item"
              entityId={item.id}
              attachment={item.attachment}
              extraInvalidateKeys={[["project-items", item.project_id]]}
            />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
