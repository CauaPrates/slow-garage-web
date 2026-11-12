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
import { MAINTENANCE_FORM_DIALOG_CLASSNAME } from "./CreateMaintenanceRecordDialog";
import { MaintenanceItemForm } from "./MaintenanceItemForm";
import { useCreateMaintenanceItem } from "./useMaintenanceItems";
import type { MaintenanceItemFormOutput } from "./schemas";

type CreateMaintenanceItemDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Etapa 07: título igual ao botão que abre ("Adicionar ao plano"); payload e defaults de antes. */
export function CreateMaintenanceItemDialog({
  vehicleId,
  open,
  onOpenChange,
}: CreateMaintenanceItemDialogProps) {
  const createItem = useCreateMaintenanceItem(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: MaintenanceItemFormOutput) {
    setError(null);
    try {
      await createItem.mutateAsync({
        name: values.name,
        category: values.category ?? null,
        interval_km: values.intervalKm ?? null,
        interval_months: values.intervalMonths ?? null,
        priority: values.priority,
        description: values.description ?? null,
        estimated_cost: values.estimatedCost ?? null,
        notes: values.notes ?? null,
        is_active: values.isActive,
      });
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={MAINTENANCE_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Adicionar ao plano</DialogTitle>
          <DialogDescription>
            Algo para acompanhar periodicamente. O serviço feito é registrado à parte, em “Registrar serviço”.
          </DialogDescription>
        </DialogHeader>
        <MaintenanceItemForm
          mode="create"
          onSubmit={handleSubmit}
          submitLabel="Adicionar ao plano"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
