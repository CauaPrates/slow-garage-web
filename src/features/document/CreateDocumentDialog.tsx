import { useState, type ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { fileAttachmentSchema } from "@/lib/attachmentSchema";
import { translatePostgresError } from "@/lib/postgresErrors";
import { DocumentForm } from "./DocumentForm";
import { useCreateDocument } from "./useDocuments";
import type { DocumentFormOutput } from "./schemas";

type CreateDocumentDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateDocumentDialog({ vehicleId, open, onOpenChange }: CreateDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createDocument = useCreateDocument(vehicleId);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    const result = fileAttachmentSchema.safeParse(picked);
    if (!result.success) {
      setFileError(result.error.issues[0]?.message ?? "Arquivo inválido.");
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(picked);
  }

  function reset() {
    setFile(null);
    setFileError(null);
    setError(null);
  }

  async function handleSubmit(values: DocumentFormOutput) {
    setError(null);
    if (!file) {
      setFileError("Escolha um arquivo.");
      return;
    }
    try {
      await createDocument.mutateAsync({
        docType: values.docType,
        title: values.title,
        expiresOn: values.expiresOn ?? null,
        issuedOn: values.issuedOn ?? null,
        amount: values.amount ?? null,
        notes: values.notes ?? null,
        file,
      });
      reset();
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo documento</DialogTitle>
        </DialogHeader>
        <DocumentForm mode="create" onSubmit={handleSubmit} submitLabel="Salvar documento">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="document-file">Arquivo</Label>
            <input
              id="document-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:text-accent-foreground"
            />
            {file && <span className="text-xs text-text-secondary">{file.name}</span>}
            <FieldError>{fileError}</FieldError>
          </div>
        </DocumentForm>
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
