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
import { useCreateFuelLog } from "./useFuelLogs";
import type { FuelLogFormOutput } from "./schemas";
import type { Database } from "@/types/database.types";

type FuelType = Database["public"]["Enums"]["fuel_type"];

type CreateFuelLogDialogProps = {
  vehicleId: string;
  defaultFuelType: FuelType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Sem `DialogTrigger` próprio — controlado externamente, mesmo motivo do `CreateExpenseDialog` (Fase 4): mais de um ponto de entrada abre a mesma instância. */
export function CreateFuelLogDialog({
  vehicleId,
  defaultFuelType,
  open,
  onOpenChange,
}: CreateFuelLogDialogProps) {
  const createFuelLog = useCreateFuelLog(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: FuelLogFormOutput) {
    setError(null);
    try {
      await createFuelLog.mutateAsync({
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
          <DialogTitle>Registrar abastecimento</DialogTitle>
        </DialogHeader>
        <FuelLogForm
          mode="create"
          defaultValues={{ fuelType: defaultFuelType }}
          onSubmit={handleSubmit}
          submitLabel="Registrar abastecimento"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
