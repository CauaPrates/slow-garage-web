import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FieldError } from "@/components/ui/field-error";
import { todayDateOnly } from "@/lib/format";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/features/vehicle/schemas";
import {
  fuelLogSchema,
  type FuelLogFormInput,
  type FuelLogFormOutput,
} from "./schemas";

type FuelLogFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<FuelLogFormInput>;
  onSubmit: (values: FuelLogFormOutput) => Promise<void>;
  submitLabel: string;
};

export function FuelLogForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
}: FuelLogFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FuelLogFormInput, unknown, FuelLogFormOutput>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      odometerKm: "",
      liters: "",
      totalAmount: "",
      isFullTank: true,
      occurredOn: todayDateOnly(),
      missedPreviousFill: false,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="odometerKm">Quilometragem (opcional)</Label>
          <Input
            id="odometerKm"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.odometerKm}
            {...register("odometerKm")}
          />
          <FieldError>{errors.odometerKm?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="liters">Litros</Label>
          <Input
            id="liters"
            type="number"
            inputMode="decimal"
            step="0.01"
            aria-invalid={!!errors.liters}
            {...register("liters")}
          />
          <FieldError>{errors.liters?.message}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="totalAmount">Valor total</Label>
          <Input
            id="totalAmount"
            type="number"
            inputMode="decimal"
            step="0.01"
            aria-invalid={!!errors.totalAmount}
            {...register("totalAmount")}
          />
          <FieldError>{errors.totalAmount?.message}</FieldError>
        </div>
        <div className="flex flex-col justify-end gap-1.5 pb-2.5">
          <Controller
            control={control}
            name="isFullTank"
            render={({ field }) => (
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-primary">
                <span>Tanque cheio</span>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Tanque cheio"
                />
              </label>
            )}
          />
        </div>
      </div>

      <details className="rounded-md border border-border" open={mode === "edit"}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="occurredOn">Data (opcional)</Label>
              <Input
                id="occurredOn"
                type="date"
                aria-invalid={!!errors.occurredOn}
                {...register("occurredOn")}
              />
              <FieldError>{errors.occurredOn?.message}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fuelType">Combustível (opcional)</Label>
              <Select
                id="fuelType"
                defaultValue=""
                aria-invalid={!!errors.fuelType}
                {...register("fuelType")}
              >
                <option value="" disabled>
                  Selecione
                </option>
                {FUEL_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {FUEL_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.fuelType?.message}</FieldError>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="station">Posto</Label>
            <Input id="station" {...register("station")} />
          </div>

          <Controller
            control={control}
            name="missedPreviousFill"
            render={({ field }) => (
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-primary">
                <span>Perdi o abastecimento anterior</span>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Perdi o abastecimento anterior"
                />
              </label>
            )}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
        </div>
      </details>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
