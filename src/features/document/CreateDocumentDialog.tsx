import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORM_DIALOG_CLASSNAME, FORM_DIALOG_HEADER_CLASSNAME, focusDialogOnOpen } from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
import { DocumentForm } from "./DocumentForm";
import { useCreateDocument } from "./useDocuments";
import type { DocumentFormOutput } from "./schemas";

/** Etapa 11: a casca comum dos formulários (como Gastos), mais estreita — poucos campos. */
export const DOCUMENT_FORM_DIALOG_CLASSNAME = cn(FORM_DIALOG_CLASSNAME, "max-w-xl");

type CreateDocumentDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * RN-6 (no hook): o arquivo sobe antes da linha — se o envio falha, nenhum
 * registro fica no banco, e o erro aparece no rodapé com o formulário ainda
 * preenchido e o arquivo ainda escolhido.
 */
export function CreateDocumentDialog({ vehicleId, open, onOpenChange }: CreateDocumentDialogProps) {
  const createDocument = useCreateDocument(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: DocumentFormOutput, file: File | null) {
    if (!file) return;
    setError(null);
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
      handleOpenChange(false);
    } catch (mutationError) {
      setError(`O documento não foi salvo. ${translatePostgresError(mutationError)}`);
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
          <DialogTitle>Enviar documento</DialogTitle>
          <DialogDescription>CRLV, apólice, nota fiscal, laudo: o arquivo fica guardado neste veículo.</DialogDescription>
        </DialogHeader>
        <DocumentForm
          mode="create"
          onSubmit={handleSubmit}
          submitLabel="Enviar documento"
          submittingLabel="Enviando…"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
