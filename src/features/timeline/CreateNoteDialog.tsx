import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORM_DIALOG_CLASSNAME, FORM_DIALOG_HEADER_CLASSNAME, focusDialogOnOpen } from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { cn } from "@/lib/utils";
import { NoteForm } from "./NoteForm";
import { useCreateNote } from "./useNotes";
import type { NoteFormOutput } from "./schemas";

/** Quatro campos: a casca comum, um passo mais estreita (como os diálogos de Documentos). */
export const NOTE_FORM_DIALOG_CLASSNAME = cn(FORM_DIALOG_CLASSNAME, "max-w-xl");

type CreateNoteDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function CreateNoteDialog({ vehicleId, open, onOpenChange, onCreated }: CreateNoteDialogProps) {
  const createNote = useCreateNote(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: NoteFormOutput) {
    setError(null);
    try {
      await createNote.mutateAsync({
        title: values.title ?? null,
        body: values.body ?? null,
        occurred_on: values.occurredOn,
        odometer_km: values.odometerKm ?? null,
      });
      onCreated?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(`A nota não foi salva. ${translatePostgresError(mutationError)}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={NOTE_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Nova nota</DialogTitle>
          <DialogDescription>
            Uma anotação sua no histórico deste veículo: o que aconteceu, um lembrete, uma ideia.
          </DialogDescription>
        </DialogHeader>
        <NoteForm mode="create" onSubmit={handleSubmit} submitLabel="Salvar nota" submitError={error} />
      </DialogContent>
    </Dialog>
  );
}
