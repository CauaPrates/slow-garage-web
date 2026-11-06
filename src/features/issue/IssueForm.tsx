import { useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITY_LEVELS, PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import {
  FormField,
  FormSection,
  NUMBER_INPUT_CLASSNAME,
  UnitAffix,
  FormBody,
  FormFooter,
} from "@/components/ui/form";
import { formatDateOnly, formatMoney, todayDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  issueSchema,
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
  type IssueFormInput,
  type IssueFormOutput,
} from "./schemas";

type IssueFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<IssueFormInput>;
  onSubmit: (values: IssueFormOutput) => Promise<void>;
  submitLabel: string;
  /** Erro do envio (banco), mostrado no rodapé junto da ação — o formulário continua com os dados. */
  submitError?: string | null;
  /** Só na edição: o campo de anexo (o registro já tem id). */
  attachment?: ReactNode;
};

/** Ordem da tela — o foco do envio inválido vai pro primeiro desta lista que tiver erro. */
const FIELD_ORDER = [
  "title",
  "description",
  "status",
  "priority",
  "reportedOn",
  "odometerKm",
  "diagnosis",
  "resolution",
  "resolvedOn",
  "cost",
] as const satisfies readonly (keyof IssueFormInput)[];

const DETAIL_FIELDS = ["diagnosis", "resolution", "resolvedOn", "cost"] as const;

const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Etapa 08: mesmo padrão dos formulários das etapas 03–07
 * (`FormSection`/`FormField`/`UnitAffix`). "Problema" (título e descrição),
 * "Situação" (status e prioridade, cada um dizendo o que é), "Relato" (data e
 * quilometragem) e "Diagnóstico e resolução" recolhível (diagnóstico,
 * resolução, data de resolução e custo).
 *
 * Campos, schema, defaults (status aberto, prioridade média, data de hoje) e
 * payload são os de antes. Status é livre (RN-2): qualquer transição vale,
 * nada é exigido para mudar, mudar para "Resolvido" não preenche a data de
 * resolução e nenhum campo é limpo. Recolher só esconde (`hidden`). Os valores
 * iniciais só entram na montagem: recarregar a lista com o diálogo aberto não
 * apaga o que está sendo digitado.
 */
export function IssueForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  submitError,
  attachment,
}: IssueFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IssueFormInput, unknown, IssueFormOutput>({
    resolver: zodResolver(issueSchema),
    shouldFocusError: false,
    defaultValues: {
      title: "",
      reportedOn: todayDateOnly(),
      priority: "medium",
      status: "open",
      ...defaultValues,
    },
  });

  // Na edição, "Diagnóstico e resolução" abre se há algo salvo nela.
  const [detailsOpen, setDetailsOpen] = useState(
    () => mode === "edit" && DETAIL_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );

  const values = useWatch({ control });
  const cost = hasValue(values.cost) ? Number(values.cost) : null;
  const detailsSummary =
    [
      hasValue(values.diagnosis) && "com diagnóstico",
      hasValue(values.resolution) && "com resolução",
      hasValue(values.resolvedOn) && `resolvido em ${formatDateOnly(values.resolvedOn!)}`,
      cost != null && !Number.isNaN(cost) && formatMoney(cost),
    ]
      .filter(Boolean)
      .join(" · ") || "Diagnóstico, resolução, data e custo";

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: IssueFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<IssueFormInput>) {
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
        <FormSection title="Problema">
          <FormField id="title" label="Título" error={errors.title?.message}>
            {(a11y) => (
              <Input
                id="title"
                placeholder="Ex.: Ruído na suspensão dianteira"
                aria-required
                {...a11y}
                {...register("title")}
              />
            )}
          </FormField>
          <FormField
            id="description"
            label="Descrição"
            optional
            hint="O que acontece, quando e em que condição."
            error={errors.description?.message}
          >
            {(a11y) => <Textarea id="description" rows={3} {...a11y} {...register("description")} />}
          </FormField>
        </FormSection>

        <FormSection title="Situação" className="border-t border-border">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="status"
              label="Status"
              hint="Qualquer mudança vale. Resolvido não preenche a data de resolução."
              error={errors.status?.message}
            >
              {(a11y) => (
                <Select id="status" {...a11y} {...register("status")}>
                  {ISSUE_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {ISSUE_STATUS_LABELS[value]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
            <FormField
              id="priority"
              label="Prioridade"
              hint="Sua ordem de importância — não é a situação."
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
          </div>
        </FormSection>

        <FormSection title="Relato" className="border-t border-border">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="reportedOn"
              label="Data do relato"
              optional
              hint={mode === "create" ? "Em branco, vale a data de hoje." : "Em branco, mantém a data salva."}
              error={errors.reportedOn?.message}
            >
              {(a11y) => <Input id="reportedOn" type="date" {...a11y} {...register("reportedOn")} />}
            </FormField>
            <FormField
              id="odometerKm"
              label="Quilometragem"
              unitLabel="em km"
              optional
              hint="Odômetro quando o problema apareceu."
              error={errors.odometerKm?.message}
            >
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
          </div>
        </FormSection>

        <FormSection
          collapsible
          title="Diagnóstico e resolução"
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          summary={detailsSummary}
        >
          <FormField id="diagnosis" label="Diagnóstico" error={errors.diagnosis?.message}>
            {(a11y) => <Textarea id="diagnosis" rows={3} {...a11y} {...register("diagnosis")} />}
          </FormField>
          <FormField id="resolution" label="Resolução" error={errors.resolution?.message}>
            {(a11y) => <Textarea id="resolution" rows={3} {...a11y} {...register("resolution")} />}
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="resolvedOn"
              label="Data de resolução"
              hint="Preenchida só por você, independente do status."
              error={errors.resolvedOn?.message}
            >
              {(a11y) => <Input id="resolvedOn" type="date" {...a11y} {...register("resolvedOn")} />}
            </FormField>
            <FormField
              id="cost"
              label="Custo informado"
              unitLabel="em reais"
              hint="Fica só no problema: não entra nos totais nem nos gastos do veículo."
              error={errors.cost?.message}
            >
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="cost"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("cost")}
                  />
                </UnitAffix>
              )}
            </FormField>
          </div>
        </FormSection>

        {mode === "edit" && attachment ? (
          <div className="border-t border-border py-5">{attachment}</div>
        ) : (
          <p className="border-t border-border py-4 text-xs text-text-secondary">
            Foto ou laudo: dá pra anexar depois de salvar, editando o problema.
          </p>
        )}
      </FormBody>

      <FormFooter error={submitError} submitting={isSubmitting} submitLabel={submitLabel} />
    </form>
  );
}
