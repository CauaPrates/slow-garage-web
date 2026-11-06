import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FORM_DIALOG_CLASSNAME,
  FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
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

/** Etapa 07: a casca do formulário do veículo (cabeçalho e rodapé fixos, só o corpo rola), na largura do gasto. */
export const MAINTENANCE_FORM_DIALOG_CLASSNAME = cn(FORM_DIALOG_CLASSNAME, "max-w-xl");

/**
 * Sem `DialogTrigger` próprio — controlado externamente (cabeçalho, estado
 * vazio, `?novo=1`, "Registrar serviço" de um item do plano e as ações rápidas
 * do dashboard e do card da garagem abrem a mesma instância). Etapa 07:
 * "Registrar serviço" no lugar de "Registrar execução", o mesmo nome do botão
 * que abre; payload, defaults e pré-seleção do item iguais.
 */
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
  const returnFocus = useReturnFocus();
  const preselectedItem = preselectedItemId
    ? items.find((i) => i.id === preselectedItemId)
    : undefined;

  function handleOpenChange(next: boolean) {
    // O formulário desmonta ao fechar; o erro do envio anterior vai junto.
    if (!next) setError(null);
    onOpenChange(next);
  }

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
          <DialogTitle>Registrar serviço</DialogTitle>
          <DialogDescription className="break-words">
            {preselectedItem
              ? `Serviço feito para “${preselectedItem.name}”, do plano.`
              : "Um serviço feito no veículo, ligado ou não a um item do plano."}
          </DialogDescription>
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
          submitLabel="Registrar serviço"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
