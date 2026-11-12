import { useRef } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  FormBody,
  FormField,
  FormFooter,
  FormSection,
  NUMBER_INPUT_CLASSNAME,
  UnitAffix,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { financingSchema, type FinancingFormInput, type FinancingFormOutput } from "./schemas";

type FinancingFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<FinancingFormInput>;
  onSubmit: (values: FinancingFormOutput) => Promise<void>;
  submitLabel: string;
  submitError?: string | null;
};

const DOUBLE_COLUMN = "grid grid-cols-1 gap-4 sm:grid-cols-2";
const FIELD_ORDER = [
  "financedAmount",
  "installmentAmount",
  "installmentCount",
  "startedOn",
  "interestRateMonthly",
  "installmentsPaid",
] as const;

/**
 * Etapa 11: o formulário de financiamento no padrão comum, separado como a
 * tela: **contrato** (o combinado) e **parcelas pagas** (o andamento). Campos,
 * schema e payload de antes — tudo opcional; parcelas pagas começa em 0 e não
 * pode passar da quantidade. Restantes e o valor delas não são campos: o banco calcula
 * (RN-1).
 *
 * Início em branco: no cadastro o banco grava hoje; na edição o campo não vai
 * no PATCH e a data salva fica.
 */
export function FinancingForm({ mode, defaultValues, onSubmit, submitLabel, submitError }: FinancingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FinancingFormInput, unknown, FinancingFormOutput>({
    resolver: zodResolver(financingSchema),
    shouldFocusError: false,
    defaultValues: {
      installmentsPaid: "0",
      ...defaultValues,
    },
  });

  const submittingRef = useRef(false);
  async function submitValid(output: FinancingFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<FinancingFormInput>) {
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
        <FormSection title="Contrato" description="Todos os campos são opcionais. Sem valor da parcela ou quantidade de parcelas, o valor das parcelas restantes não é calculado.">
          <div className={DOUBLE_COLUMN}>
            <FormField id="financedAmount" label="Valor financiado" optional unitLabel="em reais" error={errors.financedAmount?.message}>
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="financedAmount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("financedAmount")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField id="installmentAmount" label="Valor da parcela" optional unitLabel="em reais" error={errors.installmentAmount?.message}>
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="installmentAmount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("installmentAmount")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField id="installmentCount" label="Quantidade de parcelas" optional error={errors.installmentCount?.message}>
              {(a11y) => (
                <Input
                  id="installmentCount"
                  type="number"
                  inputMode="numeric"
                  className={NUMBER_INPUT_CLASSNAME}
                  {...a11y}
                  {...register("installmentCount")}
                />
              )}
            </FormField>
            <FormField
              id="startedOn"
              label="Início"
              optional
              error={errors.startedOn?.message}
              hint={mode === "create" ? "Em branco, vale a data de hoje." : "Em branco, mantém a data salva."}
            >
              {(a11y) => <Input id="startedOn" type="date" {...a11y} {...register("startedOn")} />}
            </FormField>
            <FormField
              id="interestRateMonthly"
              label="Taxa de juros mensal"
              optional
              unitLabel="em porcentagem ao mês"
              error={errors.interestRateMonthly?.message}
            >
              {(a11y) => (
                <UnitAffix suffix="% a.m.">
                  <Input
                    id="interestRateMonthly"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pr-16", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("interestRateMonthly")}
                  />
                </UnitAffix>
              )}
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Parcelas pagas" className="border-t border-border">
          <FormField
            id="installmentsPaid"
            label="Parcelas já pagas"
            error={errors.installmentsPaid?.message}
            hint={
              mode === "create"
                ? "Para um financiamento já em andamento. Depois, cada parcela é registrada na tela."
                : "Corrige a contagem. Na tela, “Registrar parcela paga” soma uma por vez."
            }
            className="sm:w-1/2 sm:pr-2"
          >
            {(a11y) => (
              <Input
                id="installmentsPaid"
                type="number"
                inputMode="numeric"
                className={NUMBER_INPUT_CLASSNAME}
                {...a11y}
                {...register("installmentsPaid")}
              />
            )}
          </FormField>
        </FormSection>
      </FormBody>

      <FormFooter error={submitError} submitting={isSubmitting} submitLabel={submitLabel} />
    </form>
  );
}
