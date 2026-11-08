import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORM_DIALOG_HEADER_CLASSNAME, focusDialogOnOpen } from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { DocumentForm } from "./DocumentForm";
import { DOCUMENT_FORM_DIALOG_CLASSNAME } from "./CreateDocumentDialog";
import { useUpdateDocument, type DocumentRow } from "./useDocuments";
import type { DocumentFormInput, DocumentFormOutput } from "./schemas";

type EditDocumentDialogProps = {
  vehicleId: string;
  doc: DocumentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(doc: DocumentRow): Partial<DocumentFormInput> {
  return {
    docType: doc.doc_type,
    title: doc.title,
    expiresOn: doc.expires_on ?? undefined,
    issuedOn: doc.issued_on ?? undefined,
    amount: doc.amount != null ? String(doc.amount) : undefined,
    notes: doc.notes ?? undefined,
  };
}

/** Não permite trocar o arquivo — só metadado. Trocar arquivo não está no escopo desta fase. */
export function EditDocumentDialog({ vehicleId, doc, open, onOpenChange }: EditDocumentDialogProps) {
  const updateDocument = useUpdateDocument(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: DocumentFormOutput) {
    setError(null);
    try {
      await updateDocument.mutateAsync({
        id: doc.id,
        doc_type: values.docType,
        title: values.title,
        expires_on: values.expiresOn ?? null,
        issued_on: values.issuedOn ?? null,
        amount: values.amount ?? null,
        notes: values.notes ?? null,
      });
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={DOCUMENT_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Editar documento</DialogTitle>
          <DialogDescription className="break-words">{doc.title}</DialogDescription>
        </DialogHeader>
        <DocumentForm
          mode="edit"
          defaultValues={toFormDefaults(doc)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
          savedFile={{ mimeType: doc.mime_type, sizeBytes: doc.file_size_bytes }}
        />
      </DialogContent>
    </Dialog>
  );
}
