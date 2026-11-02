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
import { IssueForm } from "./IssueForm";
import { useCreateIssue } from "./useIssues";
import type { IssueFormOutput } from "./schemas";

type CreateIssueDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Etapa 08: a casca do formulário do veículo (cabeçalho e rodapé fixos, só o corpo rola), na largura do gasto. */
export const ISSUE_FORM_DIALOG_CLASSNAME = cn(VEHICLE_FORM_DIALOG_CLASSNAME, "max-w-xl");

/** Etapa 08: casca nova, foco no diálogo ao abrir e de volta ao "Relatar problema" ao fechar; payload igual. */
export function CreateIssueDialog({ vehicleId, open, onOpenChange }: CreateIssueDialogProps) {
  const createIssue = useCreateIssue(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    // O formulário desmonta ao fechar; o erro do envio anterior vai junto.
    if (!next) setError(null);
    onOpenChange(next);
  }

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
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={ISSUE_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={VEHICLE_FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Relatar problema</DialogTitle>
          <DialogDescription>Um defeito, ruído ou falha deste veículo. Só o título é obrigatório.</DialogDescription>
        </DialogHeader>
        <IssueForm mode="create" onSubmit={handleSubmit} submitLabel="Relatar problema" submitError={error} />
      </DialogContent>
    </Dialog>
  );
}
