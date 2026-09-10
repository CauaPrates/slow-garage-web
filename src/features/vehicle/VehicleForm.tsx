import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { FipeValueLookup } from "./FipeValueLookup";
import { useFipeBrands, useFipeModels } from "./useFipe";
import {
  vehicleSchema,
  type VehicleFormInput,
  type VehicleFormOutput,
  FUEL_TYPES,
  FUEL_TYPE_LABELS,
  TRANSMISSIONS,
  TRANSMISSION_LABELS,
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
} from "./schemas";

type VehicleFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<VehicleFormInput>;
  onSubmit: (values: VehicleFormOutput) => Promise<void>;
  submitLabel: string;
};

export function VehicleForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
}: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormInput, unknown, VehicleFormOutput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: "",
      model: "",
      modelYear: "",
      currentOdometerKm: "",
      purchaseDate: "",
      purchasePrice: "",
      ...defaultValues,
    },
  });

  /*
    Fase 026: a escolha da FIPE mora nos próprios campos Marca e Modelo, em
    vez de um bloco separado acima. Os dois são combobox **editável**: a lista
    é sugestão, e quem tem carro fora da FIPE (importado, modificado, antigo)
    digita e segue — o formulário nunca depende da FIPE pra funcionar.

    Escolher da lista identifica o veículo e grava o id; digitar limpa o id,
    porque texto que não corresponde ao id é dado silenciosamente errado
    (RN-8).
  */
  // `useWatch` em vez de `watch()`: o `watch` devolvido pelo `useForm` não é
  // memoizável com segurança (o lint do React Compiler acusa), `useWatch` é.
  const make = useWatch({ control, name: "make" }) ?? "";
  const model = useWatch({ control, name: "model" }) ?? "";
  const fipeBrandId = useWatch({ control, name: "fipeBrandId" }) ?? null;
  const fipeModelId = useWatch({ control, name: "fipeModelId" }) ?? null;

  const brandsQuery = useFipeBrands();
  const modelsQuery = useFipeModels(fipeBrandId);

  const brandOptions = (brandsQuery.data ?? []).map((brand) => ({
    value: String(brand.id),
    label: brand.name,
  }));
  const modelOptions = (modelsQuery.data ?? []).map((m) => ({
    value: String(m.id),
    label: m.name,
  }));
  /** A consulta de valor precisa do código da FIPE, não do id da tabela (RN-9). */
  const fipeModelCode =
    modelsQuery.data?.find((m) => m.id === fipeModelId)?.fipeModelCode ?? null;

  function setText(campo: "make" | "model", texto: string) {
    setValue(campo, texto, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="make">Marca</Label>
          <ComboboxInput
            id="make"
            value={make}
            options={brandOptions}
            loading={brandsQuery.isLoading}
            aria-invalid={!!errors.make}
            placeholder="Escolha ou digite"
            emptyMessage="Não está na FIPE — pode digitar assim mesmo."
            onTextChange={(texto) => {
              setText("make", texto);
              // Texto que não veio da lista não corresponde a id nenhum.
              setValue("fipeBrandId", undefined, { shouldDirty: true });
              setValue("fipeModelId", undefined, { shouldDirty: true });
            }}
            onSelect={(option) => {
              setText("make", option.label);
              setValue("fipeBrandId", Number(option.value), {
                shouldDirty: true,
              });
              // Marca nova invalida o modelo identificado, mas não apaga o
              // texto que a pessoa já tinha escrito.
              setValue("fipeModelId", undefined, { shouldDirty: true });
            }}
          />
          <FieldError>{errors.make?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="model">Modelo</Label>
          <ComboboxInput
            id="model"
            value={model}
            // Sem marca identificada não há lista — o campo vira input comum.
            options={modelOptions}
            loading={modelsQuery.isLoading}
            aria-invalid={!!errors.model}
            placeholder={
              fipeBrandId != null ? "Escolha ou digite" : "Digite o modelo"
            }
            emptyMessage="Não está na FIPE — pode digitar assim mesmo."
            onTextChange={(texto) => {
              setText("model", texto);
              setValue("fipeModelId", undefined, { shouldDirty: true });
            }}
            onSelect={(option) => {
              setText("model", option.label);
              setValue("fipeModelId", Number(option.value), {
                shouldDirty: true,
              });
            }}
          />
          <FieldError>{errors.model?.message}</FieldError>
        </div>
      </div>

      {/*
        Só faz sentido consultar valor quando o veículo foi identificado na
        FIPE — com texto digitado à mão não há o que consultar.
      */}
      {fipeBrandId != null && fipeModelCode != null && (
        <FipeValueLookup
          brandId={fipeBrandId}
          fipeModelCode={fipeModelCode}
          onUseValue={(amount) =>
            setValue("estimatedCurrentValue", String(amount), {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="modelYear">Ano (opcional)</Label>
          <Input
            id="modelYear"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.modelYear}
            {...register("modelYear")}
          />
          <FieldError>{errors.modelYear?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentOdometerKm">Km atual (opcional)</Label>
          <Input
            id="currentOdometerKm"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.currentOdometerKm}
            {...register("currentOdometerKm")}
          />
          <FieldError>{errors.currentOdometerKm?.message}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transmission">Câmbio (opcional)</Label>
          <Select
            id="transmission"
            defaultValue=""
            aria-invalid={!!errors.transmission}
            {...register("transmission")}
          >
            <option value="" disabled>
              Selecione
            </option>
            {TRANSMISSIONS.map((value) => (
              <option key={value} value={value}>
                {TRANSMISSION_LABELS[value]}
              </option>
            ))}
          </Select>
          <FieldError>{errors.transmission?.message}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="purchaseDate">Data de compra (opcional)</Label>
          <Input
            id="purchaseDate"
            type="date"
            aria-invalid={!!errors.purchaseDate}
            {...register("purchaseDate")}
          />
          <FieldError>{errors.purchaseDate?.message}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="purchasePrice">Valor de compra (opcional)</Label>
          <Input
            id="purchasePrice"
            type="number"
            inputMode="decimal"
            step="0.01"
            aria-invalid={!!errors.purchasePrice}
            {...register("purchasePrice")}
          />
          <FieldError>{errors.purchasePrice?.message}</FieldError>
        </div>
      </div>

      <details
        className="rounded-md border border-border"
        open={mode === "edit"}
      >
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-text-primary select-none">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trim">Versão</Label>
              <Input id="trim" {...register("trim")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="color">Cor</Label>
              <Input id="color" {...register("color")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plate">Placa</Label>
              <Input id="plate" {...register("plate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="engineDescription">Motor</Label>
              <Input
                id="engineDescription"
                {...register("engineDescription")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="engineDisplacementCc">Cilindrada (cc)</Label>
              <Input
                id="engineDisplacementCc"
                type="number"
                inputMode="numeric"
                aria-invalid={!!errors.engineDisplacementCc}
                {...register("engineDisplacementCc")}
              />
              <FieldError>{errors.engineDisplacementCc?.message}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="horsepower">Potência (cv)</Label>
              <Input
                id="horsepower"
                type="number"
                inputMode="numeric"
                aria-invalid={!!errors.horsepower}
                {...register("horsepower")}
              />
              <FieldError>{errors.horsepower?.message}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="torqueNm">Torque (Nm)</Label>
              <Input
                id="torqueNm"
                type="number"
                inputMode="decimal"
                step="0.1"
                aria-invalid={!!errors.torqueNm}
                {...register("torqueNm")}
              />
              <FieldError>{errors.torqueNm?.message}</FieldError>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estimatedCurrentValue">Valor estimado atual</Label>
            <Input
              id="estimatedCurrentValue"
              type="number"
              inputMode="decimal"
              step="0.01"
              aria-invalid={!!errors.estimatedCurrentValue}
              {...register("estimatedCurrentValue")}
            />
            <FieldError>{errors.estimatedCurrentValue?.message}</FieldError>
          </div>

          {mode === "edit" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" defaultValue="active" {...register("status")}>
                {VEHICLE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {VEHICLE_STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            </div>
          )}

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
