import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  VEHICLE_FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/features/vehicle/VehicleFormParts";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { MAINTENANCE_FORM_DIALOG_CLASSNAME } from "./CreateMaintenanceRecordDialog";
import { MaintenanceItemForm } from "./MaintenanceItemForm";
import { useUpdateMaintenanceItem } from "./useMaintenanceItems";
import type { MaintenanceItemFormInput, MaintenanceItemFormOutput } from "./schemas";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type EditMaintenanceItemDialogProps = {
  vehicleId: string;
  item: MaintenanceItemWithStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(item: MaintenanceItemWithStatus): Partial<MaintenanceItemFormInput> {
  return {
    name: item.name,
    category: item.category ?? undefined,
    intervalKm: item.interval_km != null ? String(item.interval_km) : undefined,
    intervalMonths: item.interval_months != null ? String(item.interval_months) : undefined,
    priority: item.priority,
    description: item.description ?? undefined,
    estimatedCost: item.estimated_cost != null ? String(item.estimated_cost) : undefined,
    notes: item.notes ?? undefined,
    isActive: item.is_active,
  };
}

/**
 * Etapa 07: a página guarda o item aberto (a linha pode trocar de grupo —
 * vencidas, plano, inativos — e desmontar quando a lista recarrega). Os
 * valores iniciais só entram na montagem do formulário. A última execução e
 * a situação não aparecem como campo: vêm do banco (trigger e view).
 */
export function EditMaintenanceItemDialog({
  vehicleId,
  item,
  open,
  onOpenChange,
}: EditMaintenanceItemDialogProps) {
  const updateItem = useUpdateMaintenanceItem(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: MaintenanceItemFormOutput) {
    setError(null);
    try {
      await updateItem.mutateAsync({
        id: item.id,
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
        <DialogHeader className={VEHICLE_FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Editar item do plano</DialogTitle>
          <DialogDescription className="break-words">{item.name}</DialogDescription>
        </DialogHeader>
        <MaintenanceItemForm
          mode="edit"
          defaultValues={toFormDefaults(item)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
