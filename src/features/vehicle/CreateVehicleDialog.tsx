import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "./VehicleForm";
import { useCreateVehicle } from "./useVehicles";
import type { VehicleFormOutput } from "./schemas";

type CreateVehicleDialogProps = {
  triggerLabel?: string;
};

export function CreateVehicleDialog({
  triggerLabel = "Cadastrar veículo",
}: CreateVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const createVehicle = useCreateVehicle();

  async function handleSubmit(values: VehicleFormOutput) {
    await createVehicle.mutateAsync({
      make: values.make,
      model: values.model,
      model_year: values.modelYear ?? null,
      current_odometer_km: values.currentOdometerKm ?? null,
      fuel_type: values.fuelType,
      transmission: values.transmission,
      purchase_date: values.purchaseDate ?? null,
      purchase_price: values.purchasePrice ?? null,
      trim: values.trim ?? null,
      color: values.color ?? null,
      plate: values.plate ?? null,
      engine_description: values.engineDescription ?? null,
      engine_displacement_cc: values.engineDisplacementCc ?? null,
      horsepower: values.horsepower ?? null,
      torque_nm: values.torqueNm ?? null,
      estimated_current_value: values.estimatedCurrentValue ?? null,
      notes: values.notes ?? null,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar veículo</DialogTitle>
        </DialogHeader>
        <VehicleForm
          mode="create"
          onSubmit={handleSubmit}
          submitLabel="Cadastrar veículo"
        />
      </DialogContent>
    </Dialog>
  );
}
