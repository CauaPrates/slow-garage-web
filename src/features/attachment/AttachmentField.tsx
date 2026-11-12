import { useEffect, useId, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { ExternalLink, FileImage, FileText, Loader2, Paperclip } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { fileAttachmentSchema } from "@/lib/attachmentSchema";
import { formatFileSize } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import {
  getAttachmentSignedUrl,
  useRemoveAttachment,
  useUploadAttachment,
  type AttachmentEntityType,
  type AttachmentRow,
} from "./useAttachment";

type AttachmentFieldProps = {
  vehicleId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  attachment: AttachmentRow | null;
  /** Query keys extras a invalidar além de `['vehicles']` — ex.: `['project-items', projectId]`. */
  extraInvalidateKeys?: QueryKey[];
};

/** Os mesmos formatos e limite de `fileAttachmentSchema`, escritos pra quem vai escolher o arquivo. */
const ACCEPTED_HINT = "JPEG, PNG, WebP ou PDF, até 10 MB.";

function fileKind(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Imagem";
  return "Arquivo";
}

/**
 * Genérico — usado por Gasto, Problema, Item de projeto e Execução de
 * manutenção. Só existe no editar: a entidade precisa já ter id pra montar o
 * path do anexo.
 *
 * Etapa 05: o arquivo salvo fica num bloco próprio (nome, tipo, tamanho) com
 * "Abrir", "Substituir" e "Remover"; um envio em andamento aparece separado,
 * embaixo, com o nome do arquivo escolhido — o salvo só muda quando o envio
 * termina, e continua aberto pra consulta se ele falhar. Fluxo, formatos,
 * limite e bucket são os mesmos de antes.
 */
export function AttachmentField({
  vehicleId,
  entityType,
  entityId,
  attachment,
  extraInvalidateKeys,
}: AttachmentFieldProps) {
  const titleId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [pendingName, setPendingName] = useState<string | null>(null);
  // Depois de remover, o bloco do arquivo some quando a lista recarrega; o foco vai pro "Anexar arquivo".
  const focusAttachAfterRemoval = useRef(false);
  // Cancelar a remoção devolve o foco ao "Remover" (sem isto, ia pro `<body>`).
  const returnFocus = useReturnFocus();
  const upload = useUploadAttachment({ entityType, vehicleId, entityId, extraInvalidateKeys });
  const remove = useRemoveAttachment(extraInvalidateKeys);

  useEffect(() => {
    if (!attachment && focusAttachAfterRemoval.current) {
      focusAttachAfterRemoval.current = false;
      attachButtonRef.current?.focus();
    }
  }, [attachment]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = fileAttachmentSchema.safeParse(file);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Arquivo inválido.");
      event.target.value = "";
      return;
    }

    setError(null);
    setPendingName(file.name);
    try {
      await upload.mutateAsync({ file, existing: attachment });
    } catch (mutationError) {
      setError(`${file.name} não foi enviado. ${translatePostgresError(mutationError)}`);
    } finally {
      setPendingName(null);
      event.target.value = "";
    }
  }

  async function handleView() {
    if (!attachment) return;
    setViewing(true);
    try {
      const url = await getAttachmentSignedUrl(attachment.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Não foi possível abrir o anexo. Tente de novo.");
    } finally {
      setViewing(false);
    }
  }

  async function handleConfirmRemove(event: MouseEvent) {
    event.preventDefault();
    if (!attachment || remove.isPending) return;
    setRemoveError(null);
    try {
      await remove.mutateAsync(attachment);
      focusAttachAfterRemoval.current = true;
      setRemoveOpen(false);
    } catch (mutationError) {
      setRemoveError(translatePostgresError(mutationError));
    }
  }

  const isBusy = upload.isPending || remove.isPending;
  const KindIcon = attachment?.mime_type === "application/pdf" ? FileText : FileImage;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 id={titleId} className="text-sm font-semibold text-text-primary">
          Anexo
        </h3>
        <p id={hintId} className="text-xs text-text-secondary">
          {ACCEPTED_HINT}
        </p>
      </div>

      {attachment ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-bg p-3">
          <div className="flex min-w-0 items-start gap-3">
            <KindIcon className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm font-medium break-all text-text-primary">{attachment.original_filename}</p>
              <p className="text-xs text-text-secondary">
                {fileKind(attachment.mime_type)} · {formatFileSize(attachment.file_size_bytes)} · salvo neste registro
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={viewing} onClick={handleView}>
              {viewing ? (
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              )}
              {viewing ? "Abrindo…" : "Abrir"}
              <span className="sr-only"> {attachment.original_filename} (abre em outra aba)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              aria-describedby={hintId}
              onClick={() => inputRef.current?.click()}
            >
              Substituir
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isBusy}
              onClick={() => {
                setRemoveError(null);
                setRemoveOpen(true);
              }}
              className="text-error hover:bg-error/10"
            >
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button
            ref={attachButtonRef}
            type="button"
            variant="outline"
            disabled={isBusy}
            aria-describedby={hintId}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            Anexar arquivo
          </Button>
          {!pendingName && <span className="text-sm text-text-secondary">Nenhum anexo.</span>}
        </div>
      )}

      {pendingName && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md border border-dashed border-border-strong px-3 py-2.5 text-sm text-text-secondary"
        >
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
          <span className="min-w-0 break-all">
            Enviando <span className="text-text-primary">{pendingName}</span>…
            {attachment && " O anexo salvo só é trocado quando o envio terminar."}
          </span>
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
      <FieldError>{error}</FieldError>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
            <AlertDialogDescription className="break-all">
              O arquivo {attachment?.original_filename} será apagado. Essa ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldError>{removeError}</FieldError>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} disabled={remove.isPending}>
              {remove.isPending ? "Removendo…" : "Remover anexo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
