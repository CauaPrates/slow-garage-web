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
import {
  FormField,
  FormSection,
  NUMBER_INPUT_CLASSNAME,
  UnitAffix,
} from "@/features/vehicle/VehicleFormParts";
import { formatMoney, todayDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  maintenanceRecordSchema,
  type MaintenanceRecordFormInput,
  type MaintenanceRecordFormOutput,
} from "./schemas";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type MaintenanceRecordFormProps = {
  mode: "create" | "edit";
  items: MaintenanceItemWithStatus[];
  defaultValues?: Partial<MaintenanceRecordFormInput>;
  onSubmit: (values: MaintenanceRecordFormOutput) => Promise<void>;
  submitLabel: string;
  /** Erro do envio (banco), mostrado no rodapé junto da ação — o formulário continua com os dados. */
  submitError?: string | null;
  /** Só na edição: o campo de anexo (o registro já tem id). */
  attachment?: ReactNode;
};

/** Ordem da tela — o foco do envio inválido vai pro primeiro desta lista que tiver erro. */
const FIELD_ORDER = [
  "maintenanceItemId",
  "name",
  "performedOn",
  "odometerKm",
  "cost",
  "vendor",
  "notes",
] as const satisfies readonly (keyof MaintenanceRecordFormInput)[];

const DETAIL_FIELDS = ["cost", "vendor", "notes"] as const;

const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Etapa 07: um serviço feito, no padrão dos outros formulários
 * (`FormSection`/`FormField`/`UnitAffix`). "Serviço" com o vínculo opcional
 * ao plano e o nome; "Data e quilometragem"; "Detalhes" recolhível com custo,
 * fornecedor e notas (custo continua opcional, como no schema). Na edição, o
 * anexo fecha o corpo; no cadastro, uma linha diz que ele entra depois.
 *
 * RN-4: vínculo com item do plano é opcional — "Nenhum" registra um serviço
 * avulso. Escolher um item preenche o nome só se ele estiver vazio (o
 * comportamento de antes); nada mais é sobrescrito. As ajudas dizem o que o
 * banco faz de verdade: o trigger de *insert* atualiza a última execução do
 * item quando há quilometragem maior que a dele; editar não dispara nada.
 *
 * Campos, schema, defaults (data de hoje, odômetro do veículo no cadastro) e
 * payload são os de antes. Recolher só esconde (`hidden`), nunca limpa. Os
 * valores iniciais só entram na montagem: recarregar a lista com o diálogo
 * aberto não apaga o que está sendo digitado.
 */
export function MaintenanceRecordForm({
  mode,
  items,
  defaultValues,
  onSubmit,
  submitLabel,
  submitError,
  attachment,
}: MaintenanceRecordFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceRecordFormInput, unknown, MaintenanceRecordFormOutput>({
    resolver: zodResolver(maintenanceRecordSchema),
    shouldFocusError: false,
    defaultValues: {
      maintenanceItemId: "",
      name: "",
      odometerKm: "",
      performedOn: todayDateOnly(),
      ...defaultValues,
    },
  });

  // Na edição, "Detalhes" abre se há custo, fornecedor ou notas salvos.
  const [detailsOpen, setDetailsOpen] = useState(
    () => mode === "edit" && DETAIL_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );

  const values = useWatch({ control });
  const cost = hasValue(values.cost) ? Number(values.cost) : null;
  const detailsSummary =
    [
      cost != null && !Number.isNaN(cost) && formatMoney(cost),
      hasValue(values.vendor) && values.vendor!.trim(),
      hasValue(values.notes) && "com notas",
    ]
      .filter(Boolean)
      .join(" · ") || "Custo, fornecedor e notas";

  function handleItemChange(itemId: string) {
    if (!itemId) return;
    const item = items.find((i) => i.id === itemId);
    if (item && !getValues("name")) {
      setValue("name", item.name);
    }
  }

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: MaintenanceRecordFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<MaintenanceRecordFormInput>) {
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
        <FormSection title="Serviço">
          <FormField
            id="maintenanceItemId"
            label="Item do plano"
            optional
            hint={
              mode === "create"
                ? "Vincular não cria outro item. Com quilometragem maior que a da última execução do item, ele passa a contar a partir deste serviço."
                : "Mudar o vínculo ou a quilometragem aqui não altera a última execução registrada no item."
            }
            error={errors.maintenanceItemId?.message}
          >
            {(a11y) => (
              <Select
                id="maintenanceItemId"
                {...a11y}
                {...register("maintenanceItemId", {
                  onChange: (event) => handleItemChange(event.target.value),
                })}
              >
                <option value="">Nenhum — serviço avulso</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.is_active ? item.name : `${item.name} (inativo)`}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField id="name" label="Nome do serviço" error={errors.name?.message}>
            {(a11y) => (
              <Input id="name" placeholder="Ex.: Troca de óleo e filtro" aria-required {...a11y} {...register("name")} />
            )}
          </FormField>
        </FormSection>

        <FormSection title="Data e quilometragem" className="border-t border-border">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="performedOn"
              label="Data"
              optional
              hint={mode === "create" ? "Em branco, vale a data de hoje." : "Em branco, mantém a data salva."}
              error={errors.performedOn?.message}
            >
              {(a11y) => <Input id="performedOn" type="date" {...a11y} {...register("performedOn")} />}
            </FormField>
            <FormField
              id="odometerKm"
              label="Quilometragem"
              unitLabel="em km"
              optional
              hint="Odômetro na hora do serviço."
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
          </div>
        </FormSection>

        <FormSection
          collapsible
          title="Detalhes"
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          summary={detailsSummary}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField id="cost" label="Custo" unitLabel="em reais" error={errors.cost?.message}>
              {(a11y) => (
                <UnitAffix prefix="R$">
                  <Input
                    id="cost"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={cn("pl-10 font-mono", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("cost")}
                  />
                </UnitAffix>
              )}
            </FormField>
            <FormField id="vendor" label="Fornecedor" error={errors.vendor?.message}>
              {(a11y) => <Input id="vendor" placeholder="Ex.: Oficina, concessionária" {...a11y} {...register("vendor")} />}
            </FormField>
          </div>
          <FormField id="notes" label="Notas" error={errors.notes?.message}>
            {(a11y) => <Textarea id="notes" rows={3} {...a11y} {...register("notes")} />}
          </FormField>
        </FormSection>

        {mode === "edit" && attachment ? (
          <div className="border-t border-border py-5">{attachment}</div>
        ) : (
          <p className="border-t border-border py-4 text-xs text-text-secondary">
            Nota fiscal ou recibo: dá pra anexar depois de salvar, editando o serviço.
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
