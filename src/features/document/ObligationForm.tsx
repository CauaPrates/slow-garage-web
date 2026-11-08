import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FormBody,
  FormField,
  FormFooter,
  FormSection,
  NUMBER_INPUT_CLASSNAME,
  UnitAffix,
} from "@/components/ui/form";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  obligationSchema,
  OBLIGATION_KINDS,
  OBLIGATION_KIND_LABELS,
  type ObligationFormInput,
  type ObligationFormOutput,
} from "./schemas";

type ObligationFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<ObligationFormInput>;
  onSubmit: (values: ObligationFormOutput) => Promise<void>;
  submitLabel: string;
  submitError?: string | null;
};

const DOUBLE_COLUMN = "grid grid-cols-1 gap-4 sm:grid-cols-2";
const FIELD_ORDER = ["label", "kind", "dueOn", "paidOn", "amount", "provider", "notes"] as const;
const DETAIL_FIELDS = ["amount", "provider", "notes"] as const;
const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Etapa 11: o formulário de obrigação no padrão comum. Campos, schema e
 * payload de antes; só o nome é obrigatório. O texto do vencimento diz a
 * regra da view: sem data não há alerta; com data, alerta de "a vencer" nos
 * 30 dias antes (o próprio dia incluso) e de vencida a partir do dia seguinte.
 *
 * "Paga em" só existe na edição (§8 da spec): limpar a data volta a
 * obrigação para pendente — e o alerta volta, se a data pedir.
 */
export function ObligationForm({ mode, defaultValues, onSubmit, submitLabel, submitError }: ObligationFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ObligationFormInput, unknown, ObligationFormOutput>({
    resolver: zodResolver(obligationSchema),
    shouldFocusError: false,
    defaultValues: {
      kind: "other",
      label: "",
      ...defaultValues,
    },
  });

  const [detailsOpen, setDetailsOpen] = useState(
    () => mode === "edit" && DETAIL_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );
  const values = useWatch({ control });
  const amount = hasValue(values.amount) ? Number(values.amount) : null;
  const detailsSummary =
    [
      amount != null && Number.isFinite(amount) && formatMoney(amount),
      hasValue(values.provider) && values.provider!.trim(),
      hasValue(values.notes) && "com notas",
    ]
      .filter(Boolean)
      .join(" · ") || "Valor, fornecedor e notas";

  const submittingRef = useRef(false);
  async function submitValid(output: ObligationFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<ObligationFormInput>) {
    if (DETAIL_FIELDS.some((field) => fieldErrors[field])) flushSync(() => setDetailsOpen(true));
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!first) return;
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
      <FormBody>
        <FormSection title="Obrigação" description="Só o nome é obrigatório.">
          <div className={DOUBLE_COLUMN}>
            <FormField id="label" label="Nome" error={errors.label?.message}>
              {(a11y) => (
                <Input id="label" aria-required placeholder="Ex.: IPVA 2026 — 1ª parcela" {...a11y} {...register("label")} />
              )}
            </FormField>
            <FormField id="kind" label="Tipo" error={errors.kind?.message}>
              {(a11y) => (
                <Select id="kind" {...a11y} {...register("kind")}>
                  {OBLIGATION_KINDS.map((value) => (
                    <option key={value} value={value}>
                      {OBLIGATION_KIND_LABELS[value]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
        </FormSection>

        <FormSection title={mode === "edit" ? "Vencimento e pagamento" : "Vencimento"} className="border-t border-border">
          <div className={DOUBLE_COLUMN}>
            <FormField
              id="dueOn"
              label="Vencimento"
              optional
              error={errors.dueOn?.message}
              hint="Sem data, não gera alerta. Com data, avisa nos 30 dias antes e fica vencida no dia seguinte."
            >
              {(a11y) => <Input id="dueOn" type="date" {...a11y} {...register("dueOn")} />}
            </FormField>
            {mode === "edit" && (
              <FormField
                id="paidOn"
                label="Paga em"
                optional
                error={errors.paidOn?.message}
                hint="Limpar esta data volta a obrigação para pendente."
              >
                {(a11y) => <Input id="paidOn" type="date" {...a11y} {...register("paidOn")} />}
              </FormField>
            )}
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
            <FormField id="amount" label="Valor" unitLabel="em reais" error={errors.amount?.message}>
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("amount")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField id="provider" label="Fornecedor" error={errors.provider?.message}>
              {(a11y) => (
                <Input id="provider" placeholder="Seguradora, Detran, despachante" {...a11y} {...register("provider")} />
              )}
            </FormField>
          </div>
          <FormField id="notes" label="Notas" error={errors.notes?.message}>
            {(a11y) => <Textarea id="notes" rows={3} {...a11y} {...register("notes")} />}
          </FormField>
        </FormSection>
      </FormBody>

      <FormFooter error={submitError} submitting={isSubmitting} submitLabel={submitLabel} />
    </form>
  );
}
