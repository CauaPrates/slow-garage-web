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
import { useCreateMaintenanceItem } from "./useMaintenanceItems";
import type { MaintenanceItemFormOutput } from "./schemas";

type CreateMaintenanceItemDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateMaintenanceItemDialog({
  vehicleId,
  open,
  onOpenChange,
}: CreateMaintenanceItemDialogProps) {
  const createItem = useCreateMaintenanceItem(vehicleId);
  const [error, setError] = useState<string | null>(null);

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
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo item do plano</DialogTitle>
        </DialogHeader>
        <MaintenanceItemForm
          mode="create"
          onSubmit={handleSubmit}
          submitLabel="Adicionar ao plano"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
