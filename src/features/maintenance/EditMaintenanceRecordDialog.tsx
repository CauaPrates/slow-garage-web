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
  FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateOnly, formatKm } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { MAINTENANCE_FORM_DIALOG_CLASSNAME } from "./CreateMaintenanceRecordDialog";
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

/**
 * Etapa 07: "Editar serviço", com qual registro está aberto (nome, data, km)
 * na descrição e o anexo no fim do corpo (`AttachmentField`, o mesmo fluxo da
 * etapa 05). Os valores iniciais só entram na montagem (`useForm`): a lista
 * recarregar com o diálogo aberto atualiza o anexo, mas não sobrescreve o que
 * está sendo digitado.
 */
export function EditMaintenanceRecordDialog({
  vehicleId,
  record,
  items,
  open,
  onOpenChange,
}: EditMaintenanceRecordDialogProps) {
  const updateRecord = useUpdateMaintenanceRecord(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

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
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  const identity = [
    record.name,
    record.performed_on ? formatDateOnly(record.performed_on) : null,
    record.odometer_km != null ? formatKm(record.odometer_km) : "sem quilometragem",
  ]
    .filter(Boolean)
    .join(" · ");

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
          <DialogTitle>Editar serviço</DialogTitle>
          <DialogDescription className="break-words">{identity}</DialogDescription>
        </DialogHeader>
        <MaintenanceRecordForm
          mode="edit"
          items={items}
          defaultValues={toFormDefaults(record)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
          attachment={
            <AttachmentField
              vehicleId={vehicleId}
              entityType="maintenance_record"
              entityId={record.id}
              attachment={record.attachment}
            />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
