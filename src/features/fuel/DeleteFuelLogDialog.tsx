import { useRef, useState, type MouseEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogRecord,
} from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/ui/field-error";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateOnly, formatKm, formatLitersExact, formatMoney } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { fuelTypeLabel } from "./fuelLogPresentation";
import { useDeleteFuelLog } from "./useFuelLogs";
import type { FuelLogMetric } from "./useFuelLogs";

type DeleteFuelLogDialogProps = {
  vehicleId: string;
  log: FuelLogMetric;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois da exclusão confirmada pelo servidor — quem chama cuida do foco quando a linha some. */
  onDeleted?: () => void;
};

/**
 * Etapa 06: mesma forma da exclusão do gasto (etapa 05). O registro aparece
 * num cartão neutro com dados reais (data, odômetro, posto, combustível,
 * litros e valor). As consequências são as que o banco garante: o resumo e
 * os totais do veículo vêm de views sobre `fuel_logs`, e o trecho do
 * abastecimento seguinte (`lag` por odômetro em `fuel_log_metrics`) passa a
 * ser medido a partir do registro anterior a este.
 */
export function DeleteFuelLogDialog({
  vehicleId,
  log,
  open,
  onOpenChange,
  onDeleted,
}: DeleteFuelLogDialogProps) {
  const deleteFuelLog = useDeleteFuelLog(vehicleId);
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
      await deleteFuelLog.mutateAsync(log.id!);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  const meta = [
    log.odometer_km != null ? formatKm(log.odometer_km) : "Sem quilometragem",
    log.station,
    fuelTypeLabel(log),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir abastecimento?</AlertDialogTitle>
          <AlertDialogDescription>
            Sai do histórico, do resumo de consumo e dos totais do veículo. Se houver um abastecimento depois
            deste, o trecho dele passa a contar a partir do registro anterior, e o consumo dele pode mudar ou
            sumir. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogRecord
          value={
            <>
              {formatMoney(log.total_amount ?? 0)}
              <span className="block text-xs font-normal text-text-secondary">{formatLitersExact(log.liters ?? 0)}</span>
            </>
          }
        >
            <p className="text-sm font-medium text-text-primary">
              {log.occurred_on ? formatDateOnly(log.occurred_on) : "Sem data"}
            </p>
            <p className="text-xs break-words text-text-secondary">{meta}</p>
        </AlertDialogRecord>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteFuelLog.isPending}>
            {deleteFuelLog.isPending ? "Excluindo…" : "Excluir abastecimento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
