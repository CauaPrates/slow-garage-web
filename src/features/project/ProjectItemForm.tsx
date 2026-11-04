import { useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITY_LEVELS, PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import {
  FormField,
  FormSection,
  NUMBER_INPUT_CLASSNAME,
  UnitAffix,
} from "@/features/vehicle/VehicleFormParts";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  projectItemSchema,
  PROJECT_ITEM_STATUSES,
  PROJECT_ITEM_STATUS_LABELS,
  type ProjectItemFormInput,
  type ProjectItemFormOutput,
} from "./schemas";

export type ProjectOption = { id: string; name: string };

type ProjectItemFormProps = {
  mode: "create" | "edit";
  /** Lista pra escolher o projeto. Com `fixedProjectId`, é a única opção (select desabilitado) — ADR-034. */
  projects: ProjectOption[];
  fixedProjectId?: string;
  defaultValues?: Partial<ProjectItemFormInput>;
  onSubmit: (values: ProjectItemFormOutput) => Promise<void>;
  submitLabel: string;
  /** Erro do envio (banco), mostrado no rodapé junto da ação — o formulário continua com os dados. */
  submitError?: string | null;
  /** Só na edição: o campo de anexo (o item já tem id). */
  attachment?: ReactNode;
};

/** Ordem da tela — o foco do envio inválido vai pro primeiro desta lista que tiver erro. */
const FIELD_ORDER = [
  "projectId",
  "name",
  "status",
  "priority",
  "estimatedCost",
  "actualCost",
  "vendor",
  "occurredOn",
  "externalUrl",
  "description",
  "notes",
] as const satisfies readonly (keyof ProjectItemFormInput)[];

const COST_FIELDS = ["estimatedCost", "actualCost", "vendor", "occurredOn", "externalUrl"] as const;
const TEXT_FIELDS = ["description", "notes"] as const;

const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";
const money = (value: string | undefined) => {
  if (!hasValue(value)) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : formatMoney(n);
};

/**
 * Etapa 09: padrão dos formulários das etapas 03–08. "Item" (projeto e nome),
 * "Situação" (status e prioridade, cada um dizendo o que é), "Custos e
 * compra" e "Descrição e notas" recolhíveis — na edição abre a que tem dado.
 *
 * Campos, schema, defaults (Lista de desejos, prioridade média) e payload são
 * os de antes. O projeto continua sempre visível (ADR-034): fixo e
 * desabilitado no detalhe e na edição, escolhido no `?novo=1` da lista. Status
 * livre: informar custo ou data não muda o status, mudar o status não apaga
 * nem preenche custo, e o real nunca é copiado do estimado. Recolher só
 * esconde; valores iniciais só na montagem.
 */
export function ProjectItemForm({
  mode,
  projects,
  fixedProjectId,
  defaultValues,
  onSubmit,
  submitLabel,
  submitError,
  attachment,
}: ProjectItemFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectItemFormInput, unknown, ProjectItemFormOutput>({
    resolver: zodResolver(projectItemSchema),
    shouldFocusError: false,
    defaultValues: {
      projectId: fixedProjectId ?? "",
      name: "",
      status: "wishlist",
      priority: "medium",
      ...defaultValues,
    },
  });

  const [costsOpen, setCostsOpen] = useState(
    () => mode === "edit" && COST_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );
  const [textOpen, setTextOpen] = useState(
    () => mode === "edit" && TEXT_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );

  const values = useWatch({ control });
  const estimated = money(values.estimatedCost);
  const actual = money(values.actualCost);
  const costsSummary =
    [
      estimated && `Estimado ${estimated}`,
      actual && `Real ${actual}`,
      hasValue(values.vendor) && values.vendor,
      hasValue(values.occurredOn) && formatDateOnly(values.occurredOn!),
      hasValue(values.externalUrl) && "com link",
    ]
      .filter(Boolean)
      .join(" · ") || "Estimado, real, fornecedor, data e link";
  const textSummary =
    [hasValue(values.description) && "com descrição", hasValue(values.notes) && "com notas"]
      .filter(Boolean)
      .join(" · ") || "Detalhes do item e anotações";

  const projectOptions = fixedProjectId ? projects.filter((p) => p.id === fixedProjectId) : projects;

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: ProjectItemFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<ProjectItemFormInput>) {
    // Abre antes de focar: campo dentro de `hidden` não recebe foco.
    flushSync(() => {
      if (COST_FIELDS.some((field) => fieldErrors[field])) setCostsOpen(true);
      if (TEXT_FIELDS.some((field) => fieldErrors[field])) setTextOpen(true);
    });
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
        <FormSection title="Item">
          <FormField
            id="projectId"
            label="Projeto"
            hint={
              fixedProjectId
                ? "Definido pelo projeto aberto — não muda aqui."
                : "Todo item pertence a um projeto."
            }
            error={errors.projectId?.message}
          >
            {(a11y) => (
              <Select
                id="projectId"
                disabled={!!fixedProjectId}
                aria-required={!fixedProjectId || undefined}
                {...a11y}
                {...register("projectId")}
              >
                {!fixedProjectId && (
                  <option value="" disabled>
                    Selecione
                  </option>
                )}
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField id="name" label="Nome" error={errors.name?.message}>
            {(a11y) => (
              <Input
                id="name"
                placeholder="Ex.: Pistões forjados"
                aria-required
                {...a11y}
                {...register("name")}
              />
            )}
          </FormField>
        </FormSection>

        <FormSection title="Situação" className="border-t border-border">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="status"
              label="Status"
              hint="Qualquer mudança vale. Só Instalado conta no progresso."
              error={errors.status?.message}
            >
              {(a11y) => (
                <Select id="status" {...a11y} {...register("status")}>
                  {PROJECT_ITEM_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {PROJECT_ITEM_STATUS_LABELS[value]}
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

        <FormSection
          collapsible
          title="Custos e compra"
          open={costsOpen}
          onOpenChange={setCostsOpen}
          summary={costsSummary}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="estimatedCost"
              label="Custo estimado"
              unitLabel="em reais"
              hint="Referência para planejar. Não entra em total do veículo."
              error={errors.estimatedCost?.message}
            >
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="estimatedCost"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10 font-mono", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("estimatedCost")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField
              id="actualCost"
              label="Custo real"
              unitLabel="em reais"
              hint="Entra nos totais do veículo só com o item Instalado."
              error={errors.actualCost?.message}
            >
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="actualCost"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10 font-mono", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("actualCost")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField id="vendor" label="Fornecedor" error={errors.vendor?.message}>
              {(a11y) => <Input id="vendor" {...a11y} {...register("vendor")} />}
            </FormField>
            <FormField
              id="occurredOn"
              label="Data"
              hint="Com data, o item aparece no histórico do veículo."
              error={errors.occurredOn?.message}
            >
              {(a11y) => <Input id="occurredOn" type="date" {...a11y} {...register("occurredOn")} />}
            </FormField>
          </div>
          <FormField
            id="externalUrl"
            label="Link externo"
            hint="Página da peça ou do orçamento. Na lista, abre em nova aba."
            error={errors.externalUrl?.message}
          >
            {(a11y) => (
              <Input
                id="externalUrl"
                type="url"
                inputMode="url"
                placeholder="https://"
                {...a11y}
                {...register("externalUrl")}
              />
            )}
          </FormField>
        </FormSection>

        <FormSection
          collapsible
          title="Descrição e notas"
          open={textOpen}
          onOpenChange={setTextOpen}
          summary={textSummary}
        >
          <FormField id="description" label="Descrição" error={errors.description?.message}>
            {(a11y) => <Textarea id="description" rows={3} {...a11y} {...register("description")} />}
          </FormField>
          <FormField id="notes" label="Notas" error={errors.notes?.message}>
            {(a11y) => <Textarea id="notes" rows={3} {...a11y} {...register("notes")} />}
          </FormField>
        </FormSection>

        {mode === "edit" && attachment ? (
          <div className="border-t border-border py-5">{attachment}</div>
        ) : (
          <p className="border-t border-border py-4 text-xs text-text-secondary">
            Nota fiscal ou orçamento: dá pra anexar depois de salvar, editando o item.
          </p>
        )}
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
