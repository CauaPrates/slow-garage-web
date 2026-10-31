import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { translatePostgresError } from "@/lib/postgresErrors";
import { VehicleForm } from "./VehicleForm";
import {
  VEHICLE_FORM_DIALOG_CLASSNAME,
  VEHICLE_FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "./VehicleFormParts";
import { useCreateVehicle } from "./useVehicles";
import type { VehicleFormOutput } from "./schemas";

type CreateVehicleDialogProps = {
  triggerLabel?: string;
  /**
   * Gatilho do cabeçalho da garagem (redesign etapa 02): abaixo de `sm` mostra
   * só "Cadastrar" com o ícone, pra caber ao lado do título. "veículo" fica em
   * `sr-only`, então o nome acessível é sempre "Cadastrar veículo".
   */
  compactOnMobile?: boolean;
};

export function CreateVehicleDialog({
  triggerLabel = "Cadastrar veículo",
  compactOnMobile = false,
}: CreateVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createVehicle = useCreateVehicle();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // O formulário desmonta ao fechar; o erro do envio anterior vai junto.
    if (!next) setError(null);
  }

  async function handleSubmit(values: VehicleFormOutput) {
    setError(null);
    try {
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
        // Fase 020: identificação na FIPE, gravada em background quando o
        // assistente completou a seleção (ADR-075). FK pra fipe_brands/fipe_models.
        fipe_brand_id: values.fipeBrandId ?? null,
        fipe_model_id: values.fipeModelId ?? null,
      });
      handleOpenChange(false);
    } catch (mutationError) {
      // Antes a falha escapava sem nada na tela; agora aparece junto da ação.
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {compactOnMobile ? (
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>
              Cadastrar<span className="sr-only sm:not-sr-only"> veículo</span>
            </span>
          </Button>
        ) : (
          <Button>{triggerLabel}</Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={VEHICLE_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={focusDialogOnOpen}
      >
        <DialogHeader className={VEHICLE_FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Cadastrar veículo</DialogTitle>
          <DialogDescription>
            Comece por marca e modelo. O resto é opcional e pode ser preenchido
            depois.
          </DialogDescription>
        </DialogHeader>
        <VehicleForm
          mode="create"
          onSubmit={handleSubmit}
          submitLabel="Cadastrar veículo"
          submittingLabel="Cadastrando…"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
