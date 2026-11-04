import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  VEHICLE_FORM_DIALOG_CLASSNAME,
  VEHICLE_FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/features/vehicle/VehicleFormParts";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
import { ProjectForm } from "./ProjectForm";
import { useCreateProject } from "./useProjects";
import type { ProjectFormOutput } from "./schemas";

type CreateProjectDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Etapa 09: a casca do formulário do veículo (cabeçalho e rodapé fixos, só o corpo rola), na largura do gasto. */
export const PROJECT_FORM_DIALOG_CLASSNAME = cn(VEHICLE_FORM_DIALOG_CLASSNAME, "max-w-xl");

/** Etapa 09: casca nova, foco no diálogo ao abrir e de volta a quem abriu ao fechar; payload igual. */
export function CreateProjectDialog({ vehicleId, open, onOpenChange }: CreateProjectDialogProps) {
  const createProject = useCreateProject(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    // O formulário desmonta ao fechar; o erro do envio anterior vai junto.
    if (!next) setError(null);
    onOpenChange(next);
  }

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
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>
            Um plano de evolução do carro, com os itens que você quer, compra e instala. Só o nome é obrigatório.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm mode="create" onSubmit={handleSubmit} submitLabel="Criar projeto" submitError={error} />
      </DialogContent>
    </Dialog>
  );
}
