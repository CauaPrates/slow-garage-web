import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { DocumentForm } from "./DocumentForm";
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
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar documento</DialogTitle>
        </DialogHeader>
        <DocumentForm
          mode="edit"
          defaultValues={toFormDefaults(doc)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
