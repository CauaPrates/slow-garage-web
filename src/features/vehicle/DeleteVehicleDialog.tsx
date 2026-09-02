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
import { useDeleteVehicle, type VehicleWithSummary } from "./useVehicles";

type DeleteVehicleDialogProps = {
  vehicle: VehicleWithSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteVehicleDialog({
  vehicle,
  open,
  onOpenChange,
}: DeleteVehicleDialogProps) {
  const deleteVehicle = useDeleteVehicle();
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: MouseEvent) {
    // Impede o AlertDialog de fechar sozinho antes da exclusão terminar.
    event.preventDefault();
    setError(null);
    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      onOpenChange(false);
    } catch {
      setError("Não foi possível excluir o veículo. Tente de novo.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir {vehicle.make} {vehicle.model}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Todo o histórico associado a
            esse veículo será apagado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteVehicle.isPending}
          >
            {deleteVehicle.isPending ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
