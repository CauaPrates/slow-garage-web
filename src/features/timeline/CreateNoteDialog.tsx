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
import { useCreateNote } from "./useNotes";
import type { NoteFormOutput } from "./schemas";

type CreateNoteDialogProps = {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateNoteDialog({ vehicleId, open, onOpenChange }: CreateNoteDialogProps) {
  const createNote = useCreateNote(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: NoteFormOutput) {
    setError(null);
    try {
      await createNote.mutateAsync({
        title: values.title ?? null,
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
          <DialogTitle>Nova nota</DialogTitle>
        </DialogHeader>
        <NoteForm onSubmit={handleSubmit} submitLabel="Salvar nota" />
        <FieldError>{error}</FieldError>
      </DialogContent>
    </Dialog>
  );
}
