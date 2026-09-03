import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
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

export function EditMaintenanceItemDialog({
  vehicleId,
  item,
  open,
  onOpenChange,
}: EditMaintenanceItemDialogProps) {
  const updateItem = useUpdateMaintenanceItem(vehicleId);
  const [error, setError] = useState<string | null>(null);

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
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar item do plano</DialogTitle>
        </DialogHeader>
        <MaintenanceItemForm
          mode="edit"
          defaultValues={toFormDefaults(item)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
