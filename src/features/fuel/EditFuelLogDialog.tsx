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
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { FUEL_FORM_DIALOG_CLASSNAME } from "./CreateFuelLogDialog";
import { FuelLogForm } from "./FuelLogForm";
import { useUpdateFuelLog } from "./useFuelLogs";
import type { FuelLogFormInput, FuelLogFormOutput } from "./schemas";
import type { FuelLogMetric } from "./useFuelLogs";

type EditFuelLogDialogProps = {
  vehicleId: string;
  log: FuelLogMetric;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(log: FuelLogMetric): Partial<FuelLogFormInput> {
  return {
    odometerKm: log.odometer_km != null ? String(log.odometer_km) : undefined,
    liters: String(log.liters),
    totalAmount: String(log.total_amount),
    isFullTank: log.is_full_tank ?? true,
    occurredOn: log.occurred_on ?? undefined,
    fuelType: log.fuel_type ?? undefined,
    station: log.station ?? undefined,
    missedPreviousFill: log.missed_previous_fill ?? false,
    notes: log.notes ?? undefined,
  };
}

/**
 * Os valores iniciais só entram na montagem (`useForm`): a lista recarregar
 * com o diálogo aberto não sobrescreve o que está sendo digitado.
 */
export function EditFuelLogDialog({
  vehicleId,
  log,
  open,
  onOpenChange,
}: EditFuelLogDialogProps) {
  const updateFuelLog = useUpdateFuelLog(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: FuelLogFormOutput) {
    setError(null);
    try {
      await updateFuelLog.mutateAsync({
        id: log.id!,
        odometer_km: values.odometerKm ?? null,
        liters: values.liters,
        total_amount: values.totalAmount,
        is_full_tank: values.isFullTank,
        occurred_on: values.occurredOn,
        fuel_type: values.fuelType,
        station: values.station ?? null,
        missed_previous_fill: values.missedPreviousFill,
        notes: values.notes ?? null,
      });
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  // Qual registro está sendo editado: data, odômetro (se houver) e valor salvos.
  const identity = [
    log.occurred_on ? formatDateOnly(log.occurred_on) : null,
    log.odometer_km != null ? formatKm(log.odometer_km) : "sem quilometragem",
    log.total_amount != null ? formatMoney(log.total_amount) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={FUEL_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Editar abastecimento</DialogTitle>
          <DialogDescription className="break-words">{identity}</DialogDescription>
        </DialogHeader>
        <FuelLogForm
          mode="edit"
          defaultValues={toFormDefaults(log)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
