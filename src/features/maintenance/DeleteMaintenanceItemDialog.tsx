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
import { useDeleteMaintenanceItem } from "./useMaintenanceItems";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type DeleteMaintenanceItemDialogProps = {
  vehicleId: string;
  item: MaintenanceItemWithStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteMaintenanceItemDialog({
  vehicleId,
  item,
  open,
  onOpenChange,
}: DeleteMaintenanceItemDialogProps) {
  const deleteItem = useDeleteMaintenanceItem(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteItem.mutateAsync(item.id);
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{item.name}" do plano?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. O histórico de execução já
            registrado para este item não é apagado, só deixa de estar
            vinculado a um item do plano.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteItem.isPending}>
            {deleteItem.isPending ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
