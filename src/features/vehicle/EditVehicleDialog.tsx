import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VehicleForm } from "./VehicleForm";
import { VehiclePhotoUpload } from "./VehiclePhotoUpload";
import { useUpdateVehicle, type VehicleWithSummary } from "./useVehicles";
import type { VehicleFormInput, VehicleFormOutput } from "./schemas";

type EditVehicleDialogProps = {
  vehicle: VehicleWithSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(
  vehicle: VehicleWithSummary,
): Partial<VehicleFormInput> {
  return {
    make: vehicle.make,
    model: vehicle.model,
    modelYear:
      vehicle.model_year != null ? String(vehicle.model_year) : undefined,
    currentOdometerKm:
      vehicle.current_odometer_km != null
        ? String(vehicle.current_odometer_km)
        : undefined,
    fuelType: vehicle.fuel_type ?? undefined,
    transmission: vehicle.transmission ?? undefined,
    purchaseDate: vehicle.purchase_date ?? undefined,
    purchasePrice:
      vehicle.purchase_price != null
        ? String(vehicle.purchase_price)
        : undefined,
    trim: vehicle.trim ?? "",
    color: vehicle.color ?? "",
    plate: vehicle.plate ?? "",
    engineDescription: vehicle.engine_description ?? "",
    engineDisplacementCc:
      vehicle.engine_displacement_cc != null
        ? String(vehicle.engine_displacement_cc)
        : "",
    horsepower: vehicle.horsepower != null ? String(vehicle.horsepower) : "",
    torqueNm: vehicle.torque_nm != null ? String(vehicle.torque_nm) : "",
    estimatedCurrentValue:
      vehicle.estimated_current_value != null
        ? String(vehicle.estimated_current_value)
        : "",
    notes: vehicle.notes ?? "",
    status: vehicle.status,
    // Sem estas duas, abrir a edição e salvar sem tocar no assistente
    // apagaria a identificação da FIPE já gravada — o payload manda
    // `?? null` pro banco. Não presumir que o Edit espelha o Create.
    fipeBrandId: vehicle.fipe_brand_id ?? undefined,
    fipeModelId: vehicle.fipe_model_id ?? undefined,
  };
}

export function EditVehicleDialog({
  vehicle,
  open,
  onOpenChange,
}: EditVehicleDialogProps) {
  const updateVehicle = useUpdateVehicle();

  async function handleSubmit(values: VehicleFormOutput) {
    await updateVehicle.mutateAsync({
      id: vehicle.id,
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
      // Fase 020: identificação na FIPE, gravada em background quando o
      // assistente completou a seleção (ADR-075). FK pra fipe_brands/fipe_models.
      fipe_brand_id: values.fipeBrandId ?? null,
      fipe_model_id: values.fipeModelId ?? null,
      status: values.status,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Editar {vehicle.make} {vehicle.model}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <VehiclePhotoUpload
            vehicleId={vehicle.id}
            currentPhotoUrl={vehicle.photoUrl}
          />
          <VehicleForm
            mode="edit"
            defaultValues={toFormDefaults(vehicle)}
            onSubmit={handleSubmit}
            submitLabel="Salvar alterações"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
