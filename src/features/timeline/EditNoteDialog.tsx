import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { translatePostgresError } from "@/lib/postgresErrors";
import { NoteForm } from "./NoteForm";
import { useUpdateNote, type NoteLike } from "./useNotes";
import type { NoteFormInput, NoteFormOutput } from "./schemas";

type EditNoteDialogProps = {
  vehicleId: string;
  note: NoteLike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormDefaults(note: NoteLike): Partial<NoteFormInput> {
  return {
    title: note.title,
    body: note.body ?? undefined,
    occurredOn: note.occurred_on,
    odometerKm: note.odometer_km != null ? String(note.odometer_km) : undefined,
  };
}

export function EditNoteDialog({ vehicleId, note, open, onOpenChange }: EditNoteDialogProps) {
  const updateNote = useUpdateNote(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: NoteFormOutput) {
    setError(null);
    try {
      await updateNote.mutateAsync({
        id: note.id,
        title: values.title,
        body: values.body ?? null,
        occurred_on: values.occurredOn,
        odometer_km: values.odometerKm ?? null,
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
          <DialogTitle>Editar nota</DialogTitle>
        </DialogHeader>
        <NoteForm
          defaultValues={toFormDefaults(note)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
        />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
