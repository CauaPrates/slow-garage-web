import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { AttachmentField } from "@/features/attachment/AttachmentField";
import { translatePostgresError } from "@/lib/postgresErrors";
import { MaintenanceRecordForm } from "./MaintenanceRecordForm";
import { useUpdateMaintenanceRecord } from "./useMaintenanceRecords";
import type { MaintenanceRecordFormInput, MaintenanceRecordFormOutput } from "./schemas";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";
import type { MaintenanceRecordRow } from "./useMaintenanceRecords";

type EditMaintenanceRecordDialogProps = {
  vehicleId: string;
  record: MaintenanceRecordRow;
  items: MaintenanceItemWithStatus[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(record: MaintenanceRecordRow): Partial<MaintenanceRecordFormInput> {
  return {
    maintenanceItemId: record.maintenance_item_id ?? undefined,
    name: record.name,
    odometerKm: record.odometer_km != null ? String(record.odometer_km) : undefined,
    performedOn: record.performed_on ?? undefined,
    cost: record.cost != null ? String(record.cost) : undefined,
    vendor: record.vendor ?? undefined,
    notes: record.notes ?? undefined,
  };
}

export function EditMaintenanceRecordDialog({
  vehicleId,
  record,
  items,
  open,
  onOpenChange,
}: EditMaintenanceRecordDialogProps) {
  const updateRecord = useUpdateMaintenanceRecord(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: MaintenanceRecordFormOutput) {
    setError(null);
    try {
      await updateRecord.mutateAsync({
        id: record.id,
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
          <DialogTitle>Editar execução</DialogTitle>
        </DialogHeader>
        <MaintenanceRecordForm
          mode="edit"
          items={items}
          defaultValues={toFormDefaults(record)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        >
          <AttachmentField
            vehicleId={vehicleId}
            entityType="maintenance_record"
            entityId={record.id}
            attachment={record.attachment}
          />
        </MaintenanceRecordForm>
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
