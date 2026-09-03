import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
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
    odometerKm: String(log.odometer_km),
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

export function EditFuelLogDialog({
  vehicleId,
  log,
  open,
  onOpenChange,
}: EditFuelLogDialogProps) {
  const updateFuelLog = useUpdateFuelLog(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: FuelLogFormOutput) {
    setError(null);
    try {
      await updateFuelLog.mutateAsync({
        id: log.id!,
        odometer_km: values.odometerKm,
        liters: values.liters,
        total_amount: values.totalAmount,
        is_full_tank: values.isFullTank,
        occurred_on: values.occurredOn,
        fuel_type: values.fuelType,
        station: values.station ?? null,
        missed_previous_fill: values.missedPreviousFill,
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
          <DialogTitle>Editar abastecimento</DialogTitle>
        </DialogHeader>
        <FuelLogForm
          mode="edit"
          defaultValues={toFormDefaults(log)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
