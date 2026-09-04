import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { MaintenanceRecordForm } from "./MaintenanceRecordForm";
import { useCreateMaintenanceRecord } from "./useMaintenanceRecords";
import type { MaintenanceRecordFormOutput } from "./schemas";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type CreateMaintenanceRecordDialogProps = {
  vehicleId: string;
  items: MaintenanceItemWithStatus[];
  defaultOdometerKm?: number;
  preselectedItemId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Sem `DialogTrigger` próprio — controlado externamente (cabeçalho, estado vazio, `?novo=1`, "Registrar execução" de um item específico todos abrem a mesma instância). */
export function CreateMaintenanceRecordDialog({
  vehicleId,
  items,
  defaultOdometerKm,
  preselectedItemId,
  open,
  onOpenChange,
}: CreateMaintenanceRecordDialogProps) {
  const createRecord = useCreateMaintenanceRecord(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const preselectedItem = preselectedItemId
    ? items.find((i) => i.id === preselectedItemId)
    : undefined;

  async function handleSubmit(values: MaintenanceRecordFormOutput) {
    setError(null);
    try {
      await createRecord.mutateAsync({
        maintenance_item_id: values.maintenanceItemId ?? null,
        name: values.name,
        odometer_km: values.odometerKm ?? null,
        performed_on: values.performedOn,
        cost: values.cost ?? null,
        vendor: values.vendor ?? null,
        notes: values.notes ?? null,
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
          <DialogTitle>Registrar execução</DialogTitle>
        </DialogHeader>
        <MaintenanceRecordForm
          mode="create"
          items={items}
          defaultValues={{
            odometerKm: defaultOdometerKm !== undefined ? String(defaultOdometerKm) : undefined,
            maintenanceItemId: preselectedItem?.id,
            name: preselectedItem?.name,
          }}
          onSubmit={handleSubmit}
          submitLabel="Registrar execução"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
