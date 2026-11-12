import { useRef, useState } from "react";
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
import { formatDateOnly, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  projectSchema,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectFormInput,
  type ProjectFormOutput,
} from "./schemas";

type ProjectFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<ProjectFormInput>;
  onSubmit: (values: ProjectFormOutput) => Promise<void>;
  submitLabel: string;
  /** Erro do envio (banco), mostrado no rodapé junto da ação — o formulário continua com os dados. */
  submitError?: string | null;
};

/** Ordem da tela — o foco do envio inválido vai pro primeiro desta lista que tiver erro. */
const FIELD_ORDER = [
  "name",
  "status",
  "budget",
  "startedOn",
  "targetDate",
  "completedOn",
  "description",
  "notes",
] as const satisfies readonly (keyof ProjectFormInput)[];

const PLAN_FIELDS = ["budget", "startedOn", "targetDate", "completedOn"] as const;
const TEXT_FIELDS = ["description", "notes"] as const;

const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Etapa 09: padrão dos formulários das etapas 03–08
 * (`FormSection`/`FormField`/`UnitAffix`). "Projeto" (nome e situação),
 * "Orçamento e datas" e "Descrição e notas", estas duas recolhíveis — na
 * edição abre a que tem dado salvo.
 *
 * Campos, schema, defaults (status Ideia) e payload são os de antes. Status é
 * livre: mudar para Concluído não preenche a data de conclusão e nenhum campo
 * é limpo; datas não têm regra entre si (o banco não tem). Recolher só
 * esconde (`hidden`). Os valores iniciais só entram na montagem: recarregar a
 * lista com o diálogo aberto não apaga o que está sendo digitado.
 */
export function ProjectForm({ mode, defaultValues, onSubmit, submitLabel, submitError }: ProjectFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, unknown, ProjectFormOutput>({
    resolver: zodResolver(projectSchema),
    shouldFocusError: false,
    defaultValues: {
      name: "",
      status: "idea",
      ...defaultValues,
    },
  });

  const [planOpen, setPlanOpen] = useState(
    () => mode === "edit" && PLAN_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );
  const [textOpen, setTextOpen] = useState(
    () => mode === "edit" && TEXT_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );

  const values = useWatch({ control });
  const budget = hasValue(values.budget) ? Number(values.budget) : null;
  const planSummary =
    [
      budget != null && !Number.isNaN(budget) && `Orçamento ${formatMoney(budget)}`,
      hasValue(values.startedOn) && `início ${formatDateOnly(values.startedOn!)}`,
      hasValue(values.targetDate) && `alvo ${formatDateOnly(values.targetDate!)}`,
      hasValue(values.completedOn) && `conclusão ${formatDateOnly(values.completedOn!)}`,
    ]
      .filter(Boolean)
      .join(" · ") || "Orçamento, início, data alvo e conclusão";
  const textSummary =
    [hasValue(values.description) && "com descrição", hasValue(values.notes) && "com notas"]
      .filter(Boolean)
      .join(" · ") || "Objetivo do projeto e anotações";

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: ProjectFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<ProjectFormInput>) {
    // Abre antes de focar: campo dentro de `hidden` não recebe foco.
    flushSync(() => {
      if (PLAN_FIELDS.some((field) => fieldErrors[field])) setPlanOpen(true);
      if (TEXT_FIELDS.some((field) => fieldErrors[field])) setTextOpen(true);
    });
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
        <FormSection title="Projeto">
          <FormField id="name" label="Nome" error={errors.name?.message}>
            {(a11y) => (
              <Input
                id="name"
                placeholder="Ex.: Motor 2.0 forjado"
                aria-required
                {...a11y}
                {...register("name")}
              />
            )}
          </FormField>
          <FormField
            id="status"
            label="Status"
            hint="Qualquer mudança vale. Concluído não preenche a data de conclusão nem muda os itens."
            error={errors.status?.message}
          >
            {(a11y) => (
              <Select id="status" {...a11y} {...register("status")}>
                {PROJECT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {PROJECT_STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </FormSection>

        <FormSection
          collapsible
          title="Orçamento e datas"
          open={planOpen}
          onOpenChange={setPlanOpen}
          summary={planSummary}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="budget"
              label="Orçamento"
              unitLabel="em reais"
              hint="Sua referência. O detalhe compara com o custo real dos itens."
              error={errors.budget?.message}
            >
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="budget"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("budget")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField id="startedOn" label="Data de início" error={errors.startedOn?.message}>
              {(a11y) => <Input id="startedOn" type="date" {...a11y} {...register("startedOn")} />}
            </FormField>
            <FormField id="targetDate" label="Data alvo" error={errors.targetDate?.message}>
              {(a11y) => <Input id="targetDate" type="date" {...a11y} {...register("targetDate")} />}
            </FormField>
            <FormField
              id="completedOn"
              label="Data de conclusão"
              hint="Preenchida só por você, independente do status."
              error={errors.completedOn?.message}
            >
              {(a11y) => <Input id="completedOn" type="date" {...a11y} {...register("completedOn")} />}
            </FormField>
          </div>
        </FormSection>

        <FormSection
          collapsible
          title="Descrição e notas"
          open={textOpen}
          onOpenChange={setTextOpen}
          summary={textSummary}
        >
          <FormField
            id="description"
            label="Descrição"
            hint="O objetivo do projeto: o que muda no carro."
            error={errors.description?.message}
          >
            {(a11y) => <Textarea id="description" rows={3} {...a11y} {...register("description")} />}
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
