import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormSection,
  NUMBER_INPUT_CLASSNAME,
  UnitAffix,
} from "@/features/vehicle/VehicleFormParts";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/features/vehicle/schemas";
import { formatDateOnly, todayDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FuelToggleField } from "./FuelToggleField";
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
  /** Erro do envio (banco), mostrado no rodapé junto da ação — o formulário continua com os dados. */
  submitError?: string | null;
};

/** Ordem da tela — o foco do envio inválido vai pro primeiro desta lista que tiver erro. */
const FIELD_ORDER = [
  "liters",
  "totalAmount",
  "odometerKm",
  "occurredOn",
  "fuelType",
  "station",
  "notes",
] as const satisfies readonly (keyof FuelLogFormInput)[];

const DETAIL_FIELDS = ["occurredOn", "fuelType", "station", "notes"] as const;

const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Etapa 06: mesmo padrão dos formulários do veículo (etapa 03) e do gasto
 * (etapa 05). "Abastecimento" com litros e valor lado a lado (os dois
 * obrigatórios) e a quilometragem; "Cálculo do consumo" com os dois
 * interruptores que decidem se este registro entra no km/L, cada um com a
 * regra escrita; "Detalhes" recolhível com data, combustível, posto e notas.
 *
 * Campos, schema, defaults (tanque cheio ligado, anterior perdido desligado,
 * data de hoje, combustível do veículo) e payload são os de antes. Recolher
 * só esconde (`hidden`), nunca limpa. Os valores iniciais só entram na
 * montagem, então recarregar a lista com o diálogo aberto não apaga o que
 * está sendo digitado.
 */
export function FuelLogForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  submitError,
}: FuelLogFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FuelLogFormInput, unknown, FuelLogFormOutput>({
    resolver: zodResolver(fuelLogSchema),
    shouldFocusError: false,
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

  // Na edição, "Detalhes" abre se há posto ou notas salvos; data e combustível sempre vêm preenchidos e aparecem no resumo.
  const [detailsOpen, setDetailsOpen] = useState(
    () => mode === "edit" && (hasValue(defaultValues?.station) || hasValue(defaultValues?.notes)),
  );

  const values = useWatch({ control });
  const fuelLabel =
    values.fuelType && values.fuelType in FUEL_TYPE_LABELS
      ? FUEL_TYPE_LABELS[values.fuelType as keyof typeof FUEL_TYPE_LABELS]
      : null;
  const detailsSummary =
    [
      hasValue(values.occurredOn) ? formatDateOnly(values.occurredOn!) : "Data de hoje",
      fuelLabel,
      hasValue(values.station) && values.station!.trim(),
      hasValue(values.notes) && "com notas",
    ]
      .filter(Boolean)
      .join(" · ");

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: FuelLogFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<FuelLogFormInput>) {
    if (DETAIL_FIELDS.some((field) => fieldErrors[field])) {
      // Abre antes de focar: campo dentro de `hidden` não recebe foco.
      flushSync(() => setDetailsOpen(true));
    }
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!first) return;
    // Um quadro depois, pra mensagem já estar no DOM quando o leitor de tela ler o `aria-describedby`.
    requestAnimationFrame(() => {
      const element = document.getElementById(first);
      element?.focus();
      element?.scrollIntoView({ block: "center" });
    });
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(submitValid, revealErrors)(event)}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      {/* A única região que rola: cabeçalho e rodapé do diálogo ficam fixos. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
        <FormSection title="Abastecimento" description="Litros e valor total são obrigatórios.">
          {/* Lado a lado também no celular: dois números curtos, o par que se confere na bomba. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FormField id="liters" label="Litros" unitLabel="em litros" error={errors.liters?.message}>
              {(a11y) => (
                <UnitAffix suffix="L">
                  <Input
                    id="liters"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    aria-required
                    className={cn("pr-8 font-mono", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("liters")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField id="totalAmount" label="Valor total" unitLabel="em reais" error={errors.totalAmount?.message}>
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="totalAmount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    aria-required
                    className={cn("pl-10 font-mono", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("totalAmount")}
                  />
                </UnitAffix>
              )}
            </FormField>
          </div>
          <FormField
            id="odometerKm"
            label="Quilometragem"
            unitLabel="em km"
            optional
            hint="Odômetro na hora do abastecimento. Sem ela, este registro fica sem consumo calculado."
            error={errors.odometerKm?.message}
          >
            {(a11y) => (
              <UnitAffix suffix="km">
                <Input
                  id="odometerKm"
                  type="number"
                  inputMode="numeric"
                  className={cn("pr-11 font-mono", NUMBER_INPUT_CLASSNAME)}
                  {...a11y}
                  {...register("odometerKm")}
                />
              </UnitAffix>
            )}
          </FormField>
        </FormSection>

        <FormSection
          title="Cálculo do consumo"
          description="O km/L de um trecho sai de dois abastecimentos de tanque cheio seguidos, com quilometragem."
          className="gap-2 border-t border-border"
        >
          <Controller
            control={control}
            name="isFullTank"
            render={({ field }) => (
              <FuelToggleField
                id="isFullTank"
                label="Tanque cheio"
                hint="Completou até o bico desarmar. Se este ou o abastecimento anterior foi parcial, o trecho fica sem consumo."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="missedPreviousFill"
            render={({ field }) => (
              <FuelToggleField
                id="missedPreviousFill"
                label="Perdi o abastecimento anterior"
                hint="Marque se abasteceu entre o último registro e este sem registrar. O trecho até aqui fica sem consumo e sem custo por km: a distância incluiria litros que o app não conhece."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FormSection>

        <FormSection
          collapsible
          title="Detalhes"
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          summary={detailsSummary}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="occurredOn"
              label="Data"
              error={errors.occurredOn?.message}
              hint={mode === "create" ? "Em branco, vale a data de hoje." : "Em branco, mantém a data salva."}
            >
              {(a11y) => <Input id="occurredOn" type="date" {...a11y} {...register("occurredOn")} />}
            </FormField>
            <FormField id="fuelType" label="Combustível" error={errors.fuelType?.message}>
              {(a11y) => (
                <Select id="fuelType" defaultValue="" {...a11y} {...register("fuelType")}>
                  <option value="" disabled>
                    Selecione
                  </option>
                  {FUEL_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {FUEL_TYPE_LABELS[value]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
          <FormField id="station" label="Posto" error={errors.station?.message}>
            {(a11y) => <Input id="station" placeholder="Ex.: Posto Avenida, BR-116" {...a11y} {...register("station")} />}
          </FormField>
          <FormField id="notes" label="Notas" error={errors.notes?.message}>
            {(a11y) => <Textarea id="notes" rows={3} {...a11y} {...register("notes")} />}
          </FormField>
        </FormSection>
      </div>

      <div className="shrink-0 border-t border-border px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
        {submitError && (
          <div className="mb-3">
            <FieldError>{submitError}</FieldError>
          </div>
        )}
        <div className="flex gap-2 sm:justify-end sm:gap-3">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting} className="flex-1 sm:min-w-44 sm:flex-none">
            {isSubmitting && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Salvando…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
