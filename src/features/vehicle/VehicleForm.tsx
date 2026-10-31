import { useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FipeValueLookup } from "./FipeValueLookup";
import { FormField, FormSection, NUMBER_INPUT_CLASSNAME, UnitAffix } from "./VehicleFormParts";
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
  submittingLabel: string;
  /** Erro do envio (insert/update), mostrado junto da ação que o causou. */
  submitError?: string | null;
  /** Conteúdo antes das seções — a foto de capa na edição. */
  leading?: ReactNode;
};

type FieldName = keyof VehicleFormInput;
type SectionKey = "uso" | "compra" | "tecnico" | "notas";

const SECTION_FIELDS: Record<SectionKey, FieldName[]> = {
  uso: ["currentOdometerKm", "fuelType", "transmission", "status"],
  compra: ["purchaseDate", "purchasePrice", "estimatedCurrentValue"],
  tecnico: ["engineDescription", "engineDisplacementCc", "horsepower", "torqueNm"],
  notas: ["notes"],
};
const SECTION_KEYS = Object.keys(SECTION_FIELDS) as SectionKey[];

/** Ordem em que os campos aparecem na tela — o foco vai pro primeiro inválido nesta ordem. */
const FIELD_ORDER: FieldName[] = [
  "make",
  "model",
  "modelYear",
  "trim",
  "color",
  "plate",
  ...SECTION_KEYS.flatMap((key) => SECTION_FIELDS[key]),
];

function hasValue(value: unknown) {
  return value != null && String(value).trim() !== "";
}

/** Número formatado pro resumo da seção; texto que não é número aparece como foi digitado. */
function asNumber(value: unknown, format: (n: number) => string) {
  const n = Number(value);
  return Number.isFinite(n) ? format(n) : String(value);
}

const DOUBLE_COLUMN = "grid grid-cols-1 gap-4 sm:grid-cols-2";
/** Ano/placa e versão/cor são curtos: lado a lado até no celular. */
const SHORT_PAIR = "grid grid-cols-2 gap-3 sm:gap-4";

/**
 * Redesign etapa 03. Um começo simples — só marca e modelo são obrigatórios,
 * e o resto da identificação está à vista — e os detalhes opcionais em
 * seções recolhíveis que mostram, fechadas, o que guardam ou o que já foi
 * preenchido. Sem etapas, sem progresso, sem nada que pareça cobrar a ficha
 * completa.
 *
 * Na edição, a seção que tem algum dado já abre; a vazia fica fechada com o
 * que ela guarda. No envio inválido, toda seção com erro abre e o foco vai pro
 * primeiro campo inválido (o foco automático do `react-hook-form` não alcança
 * campo dentro de seção recolhida, por isso fica desligado).
 */
export function VehicleForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  submitError,
  leading,
}: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormInput, unknown, VehicleFormOutput>({
    resolver: zodResolver(vehicleSchema),
    shouldFocusError: false,
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

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(
    () =>
      Object.fromEntries(
        SECTION_KEYS.map((key) => [
          key,
          mode === "edit" &&
            SECTION_FIELDS[key].some((field) => hasValue(defaultValues?.[field])),
        ]),
      ) as Record<SectionKey, boolean>,
  );
  const setSectionOpen = (key: SectionKey, open: boolean) =>
    setOpenSections((current) => ({ ...current, [key]: open }));

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
  const values = useWatch({ control });
  const make = values.make ?? "";
  const model = values.model ?? "";
  const fipeBrandId = values.fipeBrandId ?? null;
  const fipeModelId = values.fipeModelId ?? null;

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

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: VehicleFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<VehicleFormInput>) {
    const withError = SECTION_KEYS.filter((key) =>
      SECTION_FIELDS[key].some((field) => fieldErrors[field]),
    );
    if (withError.length) {
      // Abre antes de focar: campo dentro de `hidden` não recebe foco.
      flushSync(() =>
        setOpenSections((current) => ({
          ...current,
          ...Object.fromEntries(withError.map((key) => [key, true])),
        })),
      );
    }
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!first) return;
    // Um quadro depois, pra mensagem de erro já estar no DOM quando o leitor
    // de tela ler o `aria-describedby` do campo focado.
    requestAnimationFrame(() => {
      const element = document.getElementById(first);
      element?.focus();
      element?.scrollIntoView({ block: "center" });
    });
  }

  const fipeStatusId = "vehicle-fipe-status";
  let fipeStatus: ReactNode;
  if (fipeBrandId != null && fipeModelId != null) {
    fipeStatus = (
      <>
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
        <span>Marca e modelo identificados na tabela FIPE.</span>
      </>
    );
  } else if (fipeBrandId != null && modelsQuery.isError) {
    fipeStatus =
      "Marca identificada na FIPE, mas a lista de modelos não carregou. Digite o modelo à mão.";
  } else if (fipeBrandId != null) {
    fipeStatus =
      "Marca identificada na FIPE. Escolha o modelo da lista para consultar o valor de referência, ou digite à mão.";
  } else if (brandsQuery.isError) {
    fipeStatus =
      "As sugestões da FIPE não carregaram agora. Digite marca e modelo à mão — o cadastro funciona do mesmo jeito.";
  } else {
    fipeStatus =
      "Escolha uma sugestão da tabela FIPE ou digite à mão. A FIPE é opcional.";
  }

  const summaries: Record<SectionKey, string> = {
    uso:
      [
        hasValue(values.currentOdometerKm) && asNumber(values.currentOdometerKm, formatKm),
        values.fuelType && FUEL_TYPE_LABELS[values.fuelType as keyof typeof FUEL_TYPE_LABELS],
        values.transmission &&
          TRANSMISSION_LABELS[values.transmission as keyof typeof TRANSMISSION_LABELS],
        mode === "edit" &&
          values.status &&
          VEHICLE_STATUS_LABELS[values.status as keyof typeof VEHICLE_STATUS_LABELS],
      ]
        .filter(Boolean)
        .join(" · ") ||
      (mode === "edit"
        ? "Quilometragem, combustível, câmbio e status"
        : "Quilometragem, combustível e câmbio"),
    compra:
      [
        hasValue(values.purchaseDate) && `Compra em ${formatDateOnly(values.purchaseDate!)}`,
        hasValue(values.purchasePrice) &&
          `Pago ${asNumber(values.purchasePrice, formatMoney)}`,
        hasValue(values.estimatedCurrentValue) &&
          `Estimado ${asNumber(values.estimatedCurrentValue, formatMoney)}`,
      ]
        .filter(Boolean)
        .join(" · ") || "Data e valor de compra, valor estimado atual",
    tecnico:
      [
        hasValue(values.engineDescription) && values.engineDescription,
        hasValue(values.engineDisplacementCc) && `${values.engineDisplacementCc} cc`,
        hasValue(values.horsepower) && `${values.horsepower} cv`,
        hasValue(values.torqueNm) && `${values.torqueNm} Nm`,
      ]
        .filter(Boolean)
        .join(" · ") || "Motor, cilindrada, potência e torque",
    notas: hasValue(values.notes)
      ? values.notes!.trim().replace(/\s+/g, " ")
      : "Anotações livres sobre o veículo",
  };

  return (
    <form
      // Montado no próprio evento: o lint do React Compiler não deixa passar
      // `submitValid` (que lê um ref) pro `handleSubmit` durante o render.
      onSubmit={(event) => void handleSubmit(submitValid, revealErrors)(event)}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      {/* A única região que rola: cabeçalho e rodapé do diálogo ficam fixos. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
        {leading}

        <FormSection
          title="Identificação"
          description="Marca e modelo bastam para salvar."
          className={cn(leading && "border-t border-border")}
        >
          <div className={DOUBLE_COLUMN}>
            <FormField
              id="make"
              label="Marca"
              error={errors.make?.message}
              describedBy={fipeStatusId}
            >
              {(a11y) => (
                <ComboboxInput
                  id="make"
                  value={make}
                  options={brandOptions}
                  loading={brandsQuery.isLoading}
                  aria-required
                  {...a11y}
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
              )}
            </FormField>
            <FormField
              id="model"
              label="Modelo"
              error={errors.model?.message}
              describedBy={fipeStatusId}
            >
              {(a11y) => (
                <ComboboxInput
                  id="model"
                  value={model}
                  // Sem marca identificada não há lista — o campo vira input comum.
                  options={modelOptions}
                  loading={modelsQuery.isLoading}
                  aria-required
                  {...a11y}
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
              )}
            </FormField>
          </div>

          <p
            id={fipeStatusId}
            aria-live="polite"
            className="-mt-1 flex items-start gap-1.5 text-xs text-text-secondary"
          >
            {fipeStatus}
          </p>

          {/*
            Só faz sentido consultar valor quando o veículo foi identificado na
            FIPE — com texto digitado à mão não há o que consultar. A chave
            reinicia a consulta (ano escolhido, "usado") quando o modelo muda.
          */}
          {fipeBrandId != null && fipeModelCode != null && (
            <FipeValueLookup
              key={`${fipeBrandId}-${fipeModelCode}`}
              brandId={fipeBrandId}
              fipeModelCode={fipeModelCode}
              onUseValue={(amount) => {
                setValue("estimatedCurrentValue", String(amount), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                // O valor vai pra outra seção: abre pra ele ficar à vista.
                setSectionOpen("compra", true);
              }}
            />
          )}

          <div className={SHORT_PAIR}>
            <FormField
              id="modelYear"
              label="Ano"
              optional
              error={errors.modelYear?.message}
            >
              {(a11y) => (
                <Input
                  id="modelYear"
                  type="number"
                  inputMode="numeric"
                  placeholder="Ex.: 1996"
                  className={NUMBER_INPUT_CLASSNAME}
                  {...a11y}
                  {...register("modelYear")}
                />
              )}
            </FormField>
            <FormField id="plate" label="Placa" optional>
              {(a11y) => (
                <Input
                  id="plate"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                  {...a11y}
                  {...register("plate")}
                />
              )}
            </FormField>
          </div>

          <div className={SHORT_PAIR}>
            <FormField id="trim" label="Versão" optional>
              {(a11y) => (
                <Input
                  id="trim"
                  autoComplete="off"
                  placeholder="Ex.: GTI"
                  {...a11y}
                  {...register("trim")}
                />
              )}
            </FormField>
            <FormField id="color" label="Cor" optional>
              {(a11y) => (
                <Input
                  id="color"
                  autoComplete="off"
                  placeholder="Ex.: Prata"
                  {...a11y}
                  {...register("color")}
                />
              )}
            </FormField>
          </div>
        </FormSection>

        <FormSection
          collapsible
          title="Uso e características"
          open={openSections.uso}
          onOpenChange={(open) => setSectionOpen("uso", open)}
          summary={summaries.uso}
        >
          <div className={DOUBLE_COLUMN}>
            <FormField
              id="currentOdometerKm"
              label="Quilometragem atual"
              unitLabel="km"
              error={errors.currentOdometerKm?.message}
            >
              {(a11y) => (
                <UnitAffix suffix="km">
                  <Input
                    id="currentOdometerKm"
                    type="number"
                    inputMode="numeric"
                    className={cn("pr-11", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("currentOdometerKm")}
                  />
                </UnitAffix>
              )}
            </FormField>
            {mode === "edit" && (
              <FormField id="status" label="Status">
                {(a11y) => (
                  <Select id="status" defaultValue="active" {...a11y} {...register("status")}>
                    {VEHICLE_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {VEHICLE_STATUS_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            )}
          </div>
          <div className={DOUBLE_COLUMN}>
            <FormField
              id="fuelType"
              label="Combustível"
              error={errors.fuelType?.message}
            >
              {(a11y) => (
                <Select
                  id="fuelType"
                  defaultValue=""
                  {...a11y}
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
              )}
            </FormField>
            <FormField
              id="transmission"
              label="Câmbio"
              error={errors.transmission?.message}
            >
              {(a11y) => (
                <Select
                  id="transmission"
                  defaultValue=""
                  {...a11y}
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
              )}
            </FormField>
          </div>
        </FormSection>

        <FormSection
          collapsible
          title="Compra e valores"
          open={openSections.compra}
          onOpenChange={(open) => setSectionOpen("compra", open)}
          summary={summaries.compra}
        >
          <div className={DOUBLE_COLUMN}>
            <FormField
              id="purchaseDate"
              label="Data de compra"
              error={errors.purchaseDate?.message}
            >
              {(a11y) => (
                <Input
                  id="purchaseDate"
                  type="date"
                  {...a11y}
                  {...register("purchaseDate")}
                />
              )}
            </FormField>
            <FormField
              id="purchasePrice"
              label="Valor de compra"
              unitLabel="R$"
              error={errors.purchasePrice?.message}
            >
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="purchasePrice"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("purchasePrice")}
                  />
                </UnitAffix>
              )}
            </FormField>
          </div>
          <FormField
            id="estimatedCurrentValue"
            label="Valor estimado atual"
            unitLabel="R$"
            hint="Informado por você — é este valor que fica salvo. Pode vir da referência FIPE, se você usar."
            error={errors.estimatedCurrentValue?.message}
            className="sm:max-w-[calc(50%-0.5rem)]"
          >
            {(a11y) => (
              <UnitAffix prefix="R$">
                <Input
                  id="estimatedCurrentValue"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                  {...a11y}
                  {...register("estimatedCurrentValue")}
                />
              </UnitAffix>
            )}
          </FormField>
        </FormSection>

        <FormSection
          collapsible
          title="Detalhes técnicos"
          open={openSections.tecnico}
          onOpenChange={(open) => setSectionOpen("tecnico", open)}
          summary={summaries.tecnico}
        >
          <FormField id="engineDescription" label="Motor">
            {(a11y) => (
              <Input
                id="engineDescription"
                autoComplete="off"
                placeholder="Ex.: 2.0 16V"
                {...a11y}
                {...register("engineDescription")}
              />
            )}
          </FormField>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <FormField
              id="engineDisplacementCc"
              label="Cilindrada"
              unitLabel="cc"
              error={errors.engineDisplacementCc?.message}
            >
              {(a11y) => (
                <UnitAffix suffix="cc">
                  <Input
                    id="engineDisplacementCc"
                    type="number"
                    inputMode="numeric"
                    className={cn("pr-11", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("engineDisplacementCc")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField
              id="horsepower"
              label="Potência"
              unitLabel="cv"
              error={errors.horsepower?.message}
            >
              {(a11y) => (
                <UnitAffix suffix="cv">
                  <Input
                    id="horsepower"
                    type="number"
                    inputMode="numeric"
                    className={cn("pr-11", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("horsepower")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField
              id="torqueNm"
              label="Torque"
              unitLabel="Nm"
              error={errors.torqueNm?.message}
            >
              {(a11y) => (
                <UnitAffix suffix="Nm">
                  <Input
                    id="torqueNm"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    className={cn("pr-12", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("torqueNm")}
                  />
                </UnitAffix>
              )}
            </FormField>
          </div>
        </FormSection>

        <FormSection
          collapsible
          title="Notas"
          open={openSections.notas}
          onOpenChange={(open) => setSectionOpen("notas", open)}
          summary={summaries.notas}
        >
          <FormField id="notes" label="Notas">
            {(a11y) => <Textarea id="notes" rows={4} {...a11y} {...register("notes")} />}
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:min-w-44 sm:flex-none"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
            )}
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
