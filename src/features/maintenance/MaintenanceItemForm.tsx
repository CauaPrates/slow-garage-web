import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FuelToggleField } from "@/features/fuel/FuelToggleField";
import {
  FormField,
  FormSection,
  NUMBER_INPUT_CLASSNAME,
  UnitAffix,
  FormBody,
  FormFooter,
} from "@/components/ui/form";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  INTERVAL_REQUIRED_MESSAGE,
  maintenanceItemSchema,
  PRIORITY_LEVELS,
  PRIORITY_LEVEL_LABELS,
  type MaintenanceItemFormInput,
  type MaintenanceItemFormOutput,
} from "./schemas";

type MaintenanceItemFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<MaintenanceItemFormInput>;
  onSubmit: (values: MaintenanceItemFormOutput) => Promise<void>;
  submitLabel: string;
  /** Erro do envio (banco), mostrado no rodapé junto da ação — o formulário continua com os dados. */
  submitError?: string | null;
};

/** Ordem da tela — o foco do envio inválido vai pro primeiro desta lista que tiver erro. */
const FIELD_ORDER = [
  "name",
  "intervalKm",
  "intervalMonths",
  "priority",
  "category",
  "estimatedCost",
  "description",
  "notes",
] as const satisfies readonly (keyof MaintenanceItemFormInput)[];

const DETAIL_FIELDS = ["category", "estimatedCost", "description", "notes"] as const;

const INTERVAL_HINT_ID = "interval-hint";
const INTERVAL_ERROR_ID = "interval-error";

const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Etapa 07: mesmo padrão dos formulários do veículo, do gasto e do
 * abastecimento (`FormSection`/`FormField`/`UnitAffix`). Nome e periodicidade
 * primeiro, com a regra escrita (km, meses ou os dois — pelo menos um);
 * prioridade e ativo depois, cada um dizendo o que muda; categoria, custo
 * estimado, descrição e notas em "Detalhes" recolhível.
 *
 * Campos, schema, defaults (prioridade média, ativo) e payload são os de
 * antes. A falta dos dois intervalos é um erro só, lido pelos dois campos
 * (`aria-describedby`); o foco vai pro intervalo em km. Recolher só esconde
 * (`hidden`), nunca limpa. Os valores iniciais só entram na montagem, então
 * recarregar a lista com o diálogo aberto não apaga o que está sendo digitado.
 */
export function MaintenanceItemForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  submitError,
}: MaintenanceItemFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceItemFormInput, unknown, MaintenanceItemFormOutput>({
    resolver: zodResolver(maintenanceItemSchema),
    shouldFocusError: false,
    defaultValues: {
      name: "",
      priority: "medium",
      isActive: true,
      ...defaultValues,
    },
  });

  // Na edição, "Detalhes" abre se há algo salvo nele.
  const [detailsOpen, setDetailsOpen] = useState(
    () => mode === "edit" && DETAIL_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );

  const values = useWatch({ control });
  const estimatedCost = hasValue(values.estimatedCost) ? Number(values.estimatedCost) : null;
  const detailsSummary =
    [
      hasValue(values.category) && values.category!.trim(),
      estimatedCost != null && !Number.isNaN(estimatedCost) && `${formatMoney(estimatedCost)} estimado`,
      hasValue(values.description) && "com descrição",
      hasValue(values.notes) && "com notas",
    ]
      .filter(Boolean)
      .join(" · ") || "Categoria, custo estimado, descrição e notas";

  // A falta dos dois intervalos chega pelo `path` do km; o valor inválido de cada campo continua no próprio campo.
  const periodicityMissing = errors.intervalKm?.message === INTERVAL_REQUIRED_MESSAGE;
  const kmFieldError = periodicityMissing ? undefined : errors.intervalKm?.message;
  const periodicityDescribedBy = [INTERVAL_HINT_ID, periodicityMissing ? INTERVAL_ERROR_ID : null]
    .filter(Boolean)
    .join(" ");

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: MaintenanceItemFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<MaintenanceItemFormInput>) {
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
      <FormBody>
        <FormSection title="Item e periodicidade">
          <FormField id="name" label="Nome" error={errors.name?.message}>
            {(a11y) => (
              <Input id="name" placeholder="Ex.: Troca de óleo e filtro" aria-required {...a11y} {...register("name")} />
            )}
          </FormField>

          <div className="flex flex-col gap-3">
            <p id={INTERVAL_HINT_ID} className="text-sm text-text-secondary">
              Acompanhe por quilometragem, por meses ou pelos dois — vence pelo que chegar primeiro. Informe pelo
              menos um.
            </p>
            {/* Lado a lado também no celular: dois números curtos, um par. */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FormField
                id="intervalKm"
                label="Intervalo em km"
                error={kmFieldError}
                describedBy={periodicityDescribedBy}
              >
                {(a11y) => (
                  <UnitAffix suffix="km">
                    <Input
                      id="intervalKm"
                      type="number"
                      inputMode="numeric"
                      className={cn("pr-11", NUMBER_INPUT_CLASSNAME)}
                      {...a11y}
                      aria-invalid={a11y["aria-invalid"] || periodicityMissing}
                      {...register("intervalKm")}
                    />
                  </UnitAffix>
                )}
              </FormField>
              <FormField
                id="intervalMonths"
                label="Intervalo em meses"
                error={errors.intervalMonths?.message}
                describedBy={periodicityDescribedBy}
              >
                {(a11y) => (
                  <UnitAffix suffix="meses">
                    <Input
                      id="intervalMonths"
                      type="number"
                      inputMode="numeric"
                      className={cn("pr-16", NUMBER_INPUT_CLASSNAME)}
                      {...a11y}
                      aria-invalid={a11y["aria-invalid"] || periodicityMissing}
                      {...register("intervalMonths")}
                    />
                  </UnitAffix>
                )}
              </FormField>
            </div>
            {/* Um erro só pros dois campos, lido junto de cada um pelo `aria-describedby` (sem `role="alert"`: o foco já leva a ele). */}
            <FieldError id={INTERVAL_ERROR_ID} announce={false}>
              {periodicityMissing ? INTERVAL_REQUIRED_MESSAGE : null}
            </FieldError>
          </div>
        </FormSection>

        <FormSection title="Prioridade e acompanhamento" className="border-t border-border">
          <FormField
            id="priority"
            label="Prioridade"
            hint="Sua ordem de importância. Não muda quando o item vence."
            error={errors.priority?.message}
          >
            {(a11y) => (
              <Select id="priority" {...a11y} {...register("priority")}>
                {PRIORITY_LEVELS.map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_LEVEL_LABELS[value]}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <FuelToggleField
                id="isActive"
                label="Item ativo"
                hint="Desligado, o item sai das vencidas, das próximas e dos alertas e fica em “Inativos”. Nada é apagado."
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
              id="category"
              label="Categoria"
              hint="Texto livre, ex.: Motor, Freios."
              error={errors.category?.message}
            >
              {(a11y) => <Input id="category" {...a11y} {...register("category")} />}
            </FormField>
            <FormField
              id="estimatedCost"
              label="Custo estimado"
              unitLabel="em reais"
              error={errors.estimatedCost?.message}
            >
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="estimatedCost"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("estimatedCost")}
                  />
                </UnitAffix>
              )}
            </FormField>
          </div>
          <FormField id="description" label="Descrição" error={errors.description?.message}>
            {(a11y) => <Textarea id="description" rows={2} {...a11y} {...register("description")} />}
          </FormField>
          <FormField id="notes" label="Notas" error={errors.notes?.message}>
            {(a11y) => <Textarea id="notes" rows={3} {...a11y} {...register("notes")} />}
          </FormField>
        </FormSection>
      </FormBody>

      <FormFooter error={submitError} submitting={isSubmitting} submitLabel={submitLabel} />
    </form>
  );
}
