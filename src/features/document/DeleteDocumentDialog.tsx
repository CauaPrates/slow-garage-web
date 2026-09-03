import { useState, type MouseEvent } from "react";
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
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { useDeleteDocument, type DocumentRow } from "./useDocuments";

type DeleteDocumentDialogProps = {
  vehicleId: string;
  doc: DocumentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteDocumentDialog({
  vehicleId,
  doc,
  open,
  onOpenChange,
}: DeleteDocumentDialogProps) {
  const deleteDocument = useDeleteDocument(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteDocument.mutateAsync(doc);
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{doc.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. O arquivo também será apagado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteDocument.isPending}>
            {deleteDocument.isPending ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
