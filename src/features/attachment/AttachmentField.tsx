import { useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";
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
import { fileAttachmentSchema } from "@/lib/attachmentSchema";
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

/** Genérico — usado por Gasto, Problema, Item de projeto e Execução de manutenção. Só existe no editar: a entidade precisa já ter id pra montar o path do anexo. */
export function AttachmentField({
  vehicleId,
  entityType,
  entityId,
  attachment,
  extraInvalidateKeys,
}: AttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [viewing, setViewing] = useState(false);
  const upload = useUploadAttachment({ entityType, vehicleId, entityId, extraInvalidateKeys });
  const remove = useRemoveAttachment(extraInvalidateKeys);

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
    try {
      await upload.mutateAsync({ file, existing: attachment });
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
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
    if (!attachment) return;
    setError(null);
    try {
      await remove.mutateAsync(attachment);
      setRemoveOpen(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  const isBusy = upload.isPending || remove.isPending;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text-primary">Anexo</span>

      {attachment ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-sm text-text-secondary">
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            {attachment.original_filename}
          </span>
          <Button type="button" variant="ghost" disabled={viewing} onClick={handleView}>
            {viewing ? "Abrindo…" : "Ver anexo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? "Enviando…" : "Trocar anexo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={() => setRemoveOpen(true)}
          >
            Remover anexo
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Nenhum anexo</span>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? "Enviando…" : "Anexar arquivo"}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <FieldError>{error}</FieldError>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo {attachment?.original_filename} será apagado. Essa ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} disabled={remove.isPending}>
              {remove.isPending ? "Removendo…" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
