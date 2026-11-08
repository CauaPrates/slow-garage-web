import { useRef, useState, type MouseEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRecord,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/ui/field-error";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatFileSize, formatMoney } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { DOCUMENT_TYPE_LABELS } from "./schemas";
import { useDeleteDocument, type DocumentRow } from "./useDocuments";
import { fileKindLabel } from "./documentPresentation";

type DeleteDocumentDialogProps = {
  vehicleId: string;
  doc: DocumentRow;
  /** Linha de validade já escrita pela lista ("Vence em 26/11/2026"). */
  validity: string;
  /** O documento está hoje em `vehicle_alerts` (vencido ou a vencer em 30 dias). */
  hasAlert: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

/**
 * Etapa 11: o registro no cartão comum e só as consequências que o código
 * garante — o hook apaga o arquivo no Storage e depois a linha; o documento
 * entra no Histórico (`vehicle_timeline`) e, se estiver vencido ou perto de
 * vencer, nos alertas (`vehicle_alerts`) que o dashboard, a Manutenção e o
 * sino leem. Nenhum total do veículo soma documentos.
 */
export function DeleteDocumentDialog({
  vehicleId,
  doc,
  validity,
  hasAlert,
  open,
  onOpenChange,
  onDeleted,
}: DeleteDocumentDialogProps) {
  const deleteDocument = useDeleteDocument(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const deletingRef = useRef(false);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    if (deletingRef.current) return;
    deletingRef.current = true;
    setError(null);
    try {
      await deleteDocument.mutateAsync(doc);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
          <AlertDialogDescription>
            O arquivo é apagado junto. O documento sai desta lista e do Histórico
            {hasAlert ? ", e o alerta dele sai do dashboard, da Manutenção e do sino" : ""}. Essa ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogRecord value={doc.amount != null ? formatMoney(doc.amount) : undefined}>
          <p className="text-sm font-medium break-words text-text-primary">{doc.title}</p>
          <p className="text-xs text-text-secondary">
            {DOCUMENT_TYPE_LABELS[doc.doc_type]} · {validity}
          </p>
          <p className="text-xs text-text-secondary">
            Arquivo: {fileKindLabel(doc.mime_type)} · {formatFileSize(doc.file_size_bytes)}
          </p>
        </AlertDialogRecord>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteDocument.isPending}>
            {deleteDocument.isPending ? "Excluindo…" : "Excluir documento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
