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
import { formatDateOnly, formatKm } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { useDeleteNote, type NoteLike } from "./useNotes";

type DeleteNoteDialogProps = {
  vehicleId: string;
  note: NoteLike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

/**
 * Exclusão de verdade (a nota não tem anexo nem entra em total). Etapa 13: o
 * registro no cartão comum e só o reflexo que existe — a nota é um evento da
 * `vehicle_timeline` (Histórico, atividade recente) e entra na busca.
 */
export function DeleteNoteDialog({ vehicleId, note, open, onOpenChange, onDeleted }: DeleteNoteDialogProps) {
  const deleteNote = useDeleteNote(vehicleId);
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
      await deleteNote.mutateAsync(note.id);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(`A nota não foi excluída. ${translatePostgresError(mutationError)}`);
    } finally {
      deletingRef.current = false;
    }
  }

  const context = [note.occurred_on ? formatDateOnly(note.occurred_on) : null, note.odometer_km != null ? formatKm(note.odometer_km) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
          <AlertDialogDescription>
            Sai do Histórico, da atividade recente e da busca do veículo. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogRecord>
          <p className={note.title?.trim() ? "text-sm font-medium break-words text-text-primary" : "text-sm break-words text-text-secondary"}>
            {note.title?.trim() ? note.title : "Sem título"}
          </p>
          {context && <p className="text-xs text-text-secondary tabular-nums">{context}</p>}
          {note.body && <p className="line-clamp-3 text-xs break-words whitespace-pre-wrap text-text-secondary">{note.body}</p>}
        </AlertDialogRecord>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteNote.isPending}>
            {deleteNote.isPending ? "Excluindo…" : "Excluir nota"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
