import { useId, useRef, useState, type ChangeEvent } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileImage, FileText, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
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
import { fileAttachmentSchema } from "@/lib/attachmentSchema";
import { formatFileSize, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  documentSchema,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  type DocumentFormInput,
  type DocumentFormOutput,
} from "./schemas";
import { fileKindLabel } from "./documentPresentation";

type DocumentFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<DocumentFormInput>;
  /** No cadastro, o arquivo escolhido (obrigatório); na edição, `null` — o arquivo não muda. */
  onSubmit: (values: DocumentFormOutput, file: File | null) => Promise<void>;
  submitLabel: string;
  submittingLabel?: string;
  /** Erro do envio (Storage ou banco), mostrado no rodapé junto da ação — o formulário continua preenchido. */
  submitError?: string | null;
  /** Só na edição: o arquivo salvo, mostrado sem ação de troca. */
  savedFile?: { mimeType: string; sizeBytes: number };
};

const DOUBLE_COLUMN = "grid grid-cols-1 gap-4 sm:grid-cols-2";
const FIELD_ORDER = ["title", "docType", "issuedOn", "expiresOn", "amount", "notes"] as const;
const DETAIL_FIELDS = ["amount", "notes"] as const;
const ACCEPTED_HINT = "JPEG, PNG, WebP ou PDF, até 10 MB.";
const hasValue = (value: unknown) => typeof value === "string" && value.trim() !== "";

/**
 * Etapa 11: o formulário de documento no padrão comum (cabeçalho e rodapé
 * fixos, só o corpo rola). Campos, schema e payload são os de antes; só o
 * título e — no cadastro — o arquivo são obrigatórios.
 *
 * Arquivo: escolhido aqui e enviado ao Storage antes da linha (RN-6). A
 * validação de tipo e tamanho é a mesma de todo anexo; o erro aparece junto
 * do campo. Enviar sem arquivo marca o campo e leva o foco a ele. Na edição o
 * arquivo só é mostrado: trocar não existe (só metadado).
 */
export function DocumentForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  submitError,
  savedFile,
}: DocumentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormInput, unknown, DocumentFormOutput>({
    resolver: zodResolver(documentSchema),
    shouldFocusError: false,
    defaultValues: {
      docType: "other",
      title: "",
      ...defaultValues,
    },
  });

  const fileHintId = useId();
  const fileErrorId = useId();
  const fileButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(
    () => mode === "edit" && DETAIL_FIELDS.some((field) => hasValue(defaultValues?.[field])),
  );
  const values = useWatch({ control });
  const amount = hasValue(values.amount) ? Number(values.amount) : null;
  const detailsSummary =
    [amount != null && Number.isFinite(amount) && formatMoney(amount), hasValue(values.notes) && "com notas"]
      .filter(Boolean)
      .join(" · ") || "Valor e notas";

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    const result = fileAttachmentSchema.safeParse(picked);
    if (!result.success) {
      setFileError(`${picked.name} não pode ser usado. ${result.error.issues[0]?.message ?? "Arquivo inválido."}`);
      return;
    }
    setFileError(null);
    setFile(picked);
  }

  const missingFile = mode === "create" && !file;

  function focusFileButton() {
    requestAnimationFrame(() => {
      fileButtonRef.current?.focus();
      fileButtonRef.current?.scrollIntoView({ block: "center" });
    });
  }

  /** Bloqueia o segundo envio (Enter de novo num campo, duplo clique) enquanto o primeiro não volta. */
  const submittingRef = useRef(false);
  async function submitValid(output: DocumentFormOutput) {
    if (missingFile) {
      setFileError("Escolha o arquivo do documento.");
      focusFileButton();
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(output, mode === "create" ? file : null);
    } finally {
      submittingRef.current = false;
    }
  }

  function revealErrors(fieldErrors: FieldErrors<DocumentFormInput>) {
    if (missingFile) setFileError("Escolha o arquivo do documento.");
    if (DETAIL_FIELDS.some((field) => fieldErrors[field])) flushSync(() => setDetailsOpen(true));
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!first) return;
    requestAnimationFrame(() => {
      const element = document.getElementById(first);
      element?.focus();
      element?.scrollIntoView({ block: "center" });
    });
  }

  const FileIcon = (file?.type ?? savedFile?.mimeType) === "application/pdf" ? FileText : FileImage;

  return (
    <form
      onSubmit={(event) => void handleSubmit(submitValid, revealErrors)(event)}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
    >
      <FormBody>
        <FormSection title="Identificação" description={mode === "create" ? "O título e o arquivo são obrigatórios." : "Só o título é obrigatório."}>
          <div className={DOUBLE_COLUMN}>
            <FormField id="title" label="Título" error={errors.title?.message}>
              {(a11y) => (
                <Input id="title" aria-required placeholder="Ex.: CRLV 2026" {...a11y} {...register("title")} />
              )}
            </FormField>
            <FormField id="docType" label="Tipo" error={errors.docType?.message}>
              {(a11y) => (
                <Select id="docType" {...a11y} {...register("docType")}>
                  {DOCUMENT_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {DOCUMENT_TYPE_LABELS[value]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
        </FormSection>

        <section aria-labelledby={`${fileHintId}-title`} className="flex flex-col gap-3 border-t border-border py-5">
          <div className="flex flex-col gap-1">
            <h3 id={`${fileHintId}-title`} className="type-section-title text-text-primary">
              Arquivo
            </h3>
            <p id={fileHintId} className="text-sm text-text-secondary">
              {mode === "create" ? ACCEPTED_HINT : "O arquivo enviado no cadastro não pode ser trocado na edição."}
            </p>
          </div>

          {(file || savedFile) && (
            <div className="flex min-w-0 items-start gap-3 rounded-md border border-border bg-bg px-3 py-2.5">
              <FileIcon className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
              <div className="flex min-w-0 flex-col gap-0.5">
                {file && <p className="text-sm font-medium break-all text-text-primary">{file.name}</p>}
                <p className="text-xs text-text-secondary">
                  {file
                    ? `${fileKindLabel(file.type)} · ${formatFileSize(file.size)} · enviado ao salvar`
                    : `${fileKindLabel(savedFile!.mimeType)} · ${formatFileSize(savedFile!.sizeBytes)} · salvo neste documento`}
                </p>
              </div>
            </div>
          )}

          {mode === "create" && (
            <div>
              <Button
                ref={fileButtonRef}
                type="button"
                variant="outline"
                aria-describedby={[fileHintId, fileError ? fileErrorId : null].filter(Boolean).join(" ")}
                aria-invalid={!!fileError}
                onClick={() => inputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                {file ? "Trocar arquivo" : "Escolher arquivo"}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleFileChange}
              />
            </div>
          )}
          <FieldError id={fileErrorId}>{fileError}</FieldError>
        </section>

        <FormSection
          title="Validade"
          description="Com vencimento, o documento entra nos alertas do veículo 30 dias antes."
          className="border-t border-border"
        >
          <div className={DOUBLE_COLUMN}>
            <FormField id="issuedOn" label="Emitido em" optional error={errors.issuedOn?.message}>
              {(a11y) => <Input id="issuedOn" type="date" {...a11y} {...register("issuedOn")} />}
            </FormField>
            <FormField id="expiresOn" label="Vence em" optional error={errors.expiresOn?.message}>
              {(a11y) => <Input id="expiresOn" type="date" {...a11y} {...register("expiresOn")} />}
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
          <FormField id="notes" label="Notas" error={errors.notes?.message}>
            {(a11y) => <Textarea id="notes" rows={3} {...a11y} {...register("notes")} />}
          </FormField>
        </FormSection>
      </FormBody>

      <FormFooter
        error={submitError}
        submitting={isSubmitting}
        submitLabel={submitLabel}
        submittingLabel={submittingLabel}
      />
    </form>
  );
}
