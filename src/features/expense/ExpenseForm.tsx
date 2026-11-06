import { useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormSection,
  NUMBER_INPUT_CLASSNAME,
  UnitAffix,
  FormBody,
  FormFooter,
} from "@/components/ui/form";
import { formatKm, todayDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  expenseSchema,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type ExpenseFormInput,
  type ExpenseFormOutput,
} from "./schemas";
import type { useExpenseCategories } from "./useExpenseCategories";

type ExpenseFormProps = {
  mode: "create" | "edit";
  upgrade?: boolean;
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  defaultValues?: Partial<ExpenseFormInput>;
  onSubmit: (values: ExpenseFormOutput) => Promise<void>;
  submitLabel: string;
  /** Erro do envio (banco), mostrado no rodapé junto da ação — o formulário continua com os dados. */
  submitError?: string | null;
  /** Só na edição: o campo de anexo (o registro já tem id). */
  attachment?: ReactNode;
};

const DOUBLE_COLUMN = "grid grid-cols-1 gap-4 sm:grid-cols-2";

/** Ordem da tela — o foco do envio inválido vai pro primeiro desta lista que tiver erro. */
const FIELD_ORDER = [
  "amount",
  "description",
  "categoryId",
  "occurredOn",
  "odometerKm",
  "vendor",
  "paymentMethod",
  "notes",
] as const satisfies readonly (keyof ExpenseFormInput)[];

const DETAIL_FIELDS = ["odometerKm", "vendor", "paymentMethod", "notes"] as const;

const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Etapa 05: mesmo padrão do formulário do veículo (etapa 03) — valor e
 * identificação, categoria e data, e "Detalhes" recolhível (quilometragem,
 * fornecedor, pagamento, notas). Os campos, o schema e o payload são os de
 * antes. Recolher só esconde (`hidden`), nunca limpa. No envio inválido a
 * seção com erro abre e o foco vai pro primeiro campo inválido.
 *
 * No modo upgrade (Modificações) a categoria continua fora da tela — quem
 * chama grava `upgradeCategoryId` — e a descrição se chama "Modificação".
 */
export function ExpenseForm({
  mode,
  upgrade = false,
  categories,
  defaultValues,
  onSubmit,
  submitLabel,
  submitError,
  attachment,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseSchema),
    shouldFocusError: false,
    defaultValues: {
      categoryId: "",
      amount: "",
      description: "",
      occurredOn: todayDateOnly(),
      ...defaultValues,
    },
  });

  // Na edição, "Detalhes" já abre se guarda algum dado; no cadastro começa fechada (o resumo mostra o que há).
  const [detailsOpen, setDetailsOpen] = useState(
    () => mode === "edit" && DETAIL_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );

  const values = useWatch({ control });
  const selectedCategory = categories.find((category) => category.id === values.categoryId);
  const paymentLabel =
    values.paymentMethod && values.paymentMethod in PAYMENT_METHOD_LABELS
      ? PAYMENT_METHOD_LABELS[values.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]
      : null;
  const odometer = hasValue(values.odometerKm) ? Number(values.odometerKm) : null;
  const detailsSummary =
    [
      odometer != null && Number.isFinite(odometer) && formatKm(odometer),
      hasValue(values.vendor) && values.vendor!.trim(),
      paymentLabel,
      hasValue(values.notes) && "com notas",
    ]
      .filter(Boolean)
      .join(" · ") || "Quilometragem, fornecedor, pagamento e notas";

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: ExpenseFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<ExpenseFormInput>) {
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

  const noun = upgrade ? "o upgrade" : "o gasto";

  return (
    <form
      onSubmit={(event) => void handleSubmit(submitValid, revealErrors)(event)}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      {/* A única região que rola: cabeçalho e rodapé do diálogo ficam fixos. */}
      <FormBody>
        <FormSection title="Valor e identificação" description="Só o valor é obrigatório.">
          <div className={DOUBLE_COLUMN}>
            <FormField id="amount" label="Valor" unitLabel="em reais" error={errors.amount?.message}>
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    aria-required
                    className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("amount")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField
              id="description"
              label={upgrade ? "Modificação" : "Descrição"}
              optional
              error={errors.description?.message}
            >
              {(a11y) => (
                <Input
                  id="description"
                  placeholder={upgrade ? "Ex.: kit de suspensão esportiva" : "Ex.: jogo de pneus dianteiros"}
                  {...a11y}
                  {...register("description")}
                />
              )}
            </FormField>
          </div>
        </FormSection>

        <FormSection
          title={upgrade ? "Data" : "Categoria e data"}
          description={upgrade ? "Registrado na categoria Upgrade." : undefined}
          className="border-t border-border"
        >
          <div className={DOUBLE_COLUMN}>
            {!upgrade && (
              <FormField
                id="categoryId"
                label="Categoria"
                optional
                error={errors.categoryId?.message}
                hint={
                  selectedCategory?.slug === "upgrade" && selectedCategory.user_id === null
                    ? "Também aparece em Modificações."
                    : undefined
                }
              >
                {(a11y) => (
                  <Select id="categoryId" {...a11y} {...register("categoryId")}>
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            )}
            <FormField
              id="occurredOn"
              label="Data"
              optional
              error={errors.occurredOn?.message}
              hint={mode === "create" ? "Em branco, vale a data de hoje." : "Em branco, mantém a data salva."}
            >
              {(a11y) => <Input id="occurredOn" type="date" {...a11y} {...register("occurredOn")} />}
            </FormField>
          </div>
        </FormSection>

        <FormSection
          collapsible
          title="Detalhes"
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          summary={detailsSummary}
        >
          <div className={DOUBLE_COLUMN}>
            <FormField id="odometerKm" label="Quilometragem" unitLabel="em km" error={errors.odometerKm?.message}>
              {(a11y) => (
                <UnitAffix suffix="km">
                  <Input
                    id="odometerKm"
                    type="number"
                    inputMode="numeric"
                    className={cn("pr-11", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("odometerKm")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField id="vendor" label="Fornecedor" error={errors.vendor?.message}>
              {(a11y) => <Input id="vendor" placeholder="Loja, oficina ou prestador" {...a11y} {...register("vendor")} />}
            </FormField>
          </div>
          <FormField id="paymentMethod" label="Forma de pagamento" error={errors.paymentMethod?.message}>
            {(a11y) => (
              <Select id="paymentMethod" {...a11y} {...register("paymentMethod")}>
                <option value="">Não informado</option>
                {PAYMENT_METHODS.map((value) => (
                  <option key={value} value={value}>
                    {PAYMENT_METHOD_LABELS[value]}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField id="notes" label="Notas" error={errors.notes?.message}>
            {(a11y) => <Textarea id="notes" rows={3} {...a11y} {...register("notes")} />}
          </FormField>
        </FormSection>

        {mode === "edit" && attachment ? (
          <div className="border-t border-border py-5">{attachment}</div>
        ) : (
          <p className="border-t border-border py-4 text-xs text-text-secondary">
            Comprovante ou nota fiscal: dá pra anexar depois de salvar, editando {noun}.
          </p>
        )}
      </FormBody>

      <FormFooter error={submitError} submitting={isSubmitting} submitLabel={submitLabel} />
    </form>
  );
}
