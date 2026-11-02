import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  VEHICLE_FORM_DIALOG_CLASSNAME,
  VEHICLE_FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/features/vehicle/VehicleFormParts";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
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

/** Etapa 06: a casca do formulário do veículo (cabeçalho e rodapé fixos, só o corpo rola), na largura do gasto. */
export const FUEL_FORM_DIALOG_CLASSNAME = cn(VEHICLE_FORM_DIALOG_CLASSNAME, "max-w-xl");

/**
 * Sem `DialogTrigger` próprio — controlado externamente, mesmo motivo do
 * `CreateExpenseDialog` (Fase 4): mais de um ponto de entrada abre a mesma
 * instância (cabeçalho, estado vazio, `?novo=1`, ações rápidas do dashboard e
 * do card da garagem).
 */
export function CreateFuelLogDialog({
  vehicleId,
  defaultFuelType,
  open,
  onOpenChange,
}: CreateFuelLogDialogProps) {
  const createFuelLog = useCreateFuelLog(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    // O formulário desmonta ao fechar; o erro do envio anterior vai junto.
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: FuelLogFormOutput) {
    setError(null);
    try {
      await createFuelLog.mutateAsync({
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
        <DialogHeader className={VEHICLE_FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Registrar abastecimento</DialogTitle>
          <DialogDescription>Entra no histórico de combustível e nos gastos do veículo.</DialogDescription>
        </DialogHeader>
        <FuelLogForm
          mode="create"
          defaultValues={{ fuelType: defaultFuelType }}
          onSubmit={handleSubmit}
          submitLabel="Registrar abastecimento"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
