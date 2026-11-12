import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FORM_DIALOG_HEADER_CLASSNAME, focusDialogOnOpen } from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { translatePostgresError } from "@/lib/postgresErrors";
import { NOTE_FORM_DIALOG_CLASSNAME } from "./CreateNoteDialog";
import { NoteForm } from "./NoteForm";
import { useUpdateNote, type NoteLike } from "./useNotes";
import type { NoteFormInput, NoteFormOutput } from "./schemas";

type EditNoteDialogProps = {
  vehicleId: string;
  note: NoteLike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

function toFormDefaults(note: NoteLike): Partial<NoteFormInput> {
  return {
    title: note.title ?? undefined,
    body: note.body ?? undefined,
    occurredOn: note.occurred_on || undefined,
    odometerKm: note.odometer_km != null ? String(note.odometer_km) : undefined,
  };
}

/** Payload de antes: o que vem vazio vira `null`, exceto a data (vazia não vai no PATCH e a registrada fica). */
export function EditNoteDialog({ vehicleId, note, open, onOpenChange, onSaved }: EditNoteDialogProps) {
  const updateNote = useUpdateNote(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: NoteFormOutput) {
    setError(null);
    try {
      await updateNote.mutateAsync({
        id: note.id,
        title: values.title ?? null,
        body: values.body ?? null,
        occurred_on: values.occurredOn,
        odometer_km: values.odometerKm ?? null,
      });
      onSaved?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(`As alterações não foram salvas. ${translatePostgresError(mutationError)}`);
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
          <DialogTitle>Editar nota</DialogTitle>
          <DialogDescription>A nota muda no Histórico e na atividade recente do veículo.</DialogDescription>
        </DialogHeader>
        <NoteForm
          mode="edit"
          defaultValues={toFormDefaults(note)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
        />
      </DialogContent>
    </Dialog>
  );
}
