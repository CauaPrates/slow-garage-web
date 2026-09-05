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
import { formatDateOnly } from "@/lib/format";
import { useDeleteFuelLog } from "./useFuelLogs";
import type { FuelLogMetric } from "./useFuelLogs";

type DeleteFuelLogDialogProps = {
  vehicleId: string;
  log: FuelLogMetric;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteFuelLogDialog({
  vehicleId,
  log,
  open,
  onOpenChange,
}: DeleteFuelLogDialogProps) {
  const deleteFuelLog = useDeleteFuelLog(vehicleId);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteFuelLog.mutateAsync(log.id!);
      onOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir abastecimento de {formatDateOnly(log.occurred_on!)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteFuelLog.isPending}>
            {deleteFuelLog.isPending ? "Excluindo…" : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
