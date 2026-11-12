import { useRef } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormBody, FormField, FormFooter, FormSection, NUMBER_INPUT_CLASSNAME, UnitAffix } from "@/components/ui/form";
import { todayDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import { noteSchema, type NoteFormInput, type NoteFormOutput } from "./schemas";

type NoteFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<NoteFormInput>;
  onSubmit: (values: NoteFormOutput) => Promise<void>;
  submitLabel: string;
  submitError?: string | null;
};

const FIELD_ORDER = ["title", "body", "occurredOn", "odometerKm"] as const;

/**
 * Etapa 13: a nota no padrão comum de formulário. Campos, schema e payload de
 * antes — tudo opcional (título e corpo podem ficar vazios; o banco grava a
 * data de hoje quando ela não vem). Só a quilometragem valida: inteiro ≥ 0,
 * vazio ou 0 aceitos. Sem seção recolhível: são quatro campos.
 *
 * Data em branco: no cadastro o banco grava hoje (`default current_date`); na
 * edição o campo não vai no PATCH e a data já registrada fica — a ajuda diz
 * qual dos dois acontece.
 */
export function NoteForm({ mode, defaultValues, onSubmit, submitLabel, submitError }: NoteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormInput, unknown, NoteFormOutput>({
    resolver: zodResolver(noteSchema),
    shouldFocusError: false,
    defaultValues: {
      title: "",
      occurredOn: todayDateOnly(),
      ...defaultValues,
    },
  });

  // Dois Enter (ou dois cliques) seguidos: um envio só.
  const submittingRef = useRef(false);
  async function submitValid(output: NoteFormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<NoteFormInput>) {
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
        <FormSection title="Nota" description="Tudo é opcional.">
          <FormField id="title" label="Título" optional error={errors.title?.message}>
            {(a11y) => <Input id="title" placeholder="Ex.: Ruído na suspensão" {...a11y} {...register("title")} />}
          </FormField>
          <FormField id="body" label="Anotação" optional error={errors.body?.message}>
            {(a11y) => <Textarea id="body" rows={5} {...a11y} {...register("body")} />}
          </FormField>
        </FormSection>

        <FormSection title="Quando" className="border-t border-border">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="occurredOn"
              label="Data"
              optional
              error={errors.occurredOn?.message}
              hint={mode === "create" ? "Em branco, fica a data de hoje." : "Em branco, a data já registrada continua."}
            >
              {(a11y) => <Input id="occurredOn" type="date" {...a11y} {...register("occurredOn")} />}
            </FormField>
            <FormField
              id="odometerKm"
              label="Quilometragem"
              optional
              unitLabel="em quilômetros"
              error={errors.odometerKm?.message}
            >
              {(a11y) => (
                <UnitAffix suffix="km">
                  <Input
                    id="odometerKm"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    className={cn("pr-11", NUMBER_INPUT_CLASSNAME)}
                    {...a11y}
                    {...register("odometerKm")}
                  />
                </UnitAffix>
              )}
            </FormField>
          </div>
        </FormSection>
      </FormBody>

      <FormFooter error={submitError} submitting={isSubmitting} submitLabel={submitLabel} />
    </form>
  );
}
