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
} from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/ui/field-error";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { useDeleteMaintenanceRecord } from "./useMaintenanceRecords";
import type { MaintenanceRecordRow } from "./useMaintenanceRecords";

type DeleteMaintenanceRecordDialogProps = {
  vehicleId: string;
  record: MaintenanceRecordRow;
  /** Nome do item do plano vinculado, quando há. */
  linkedItemName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois da exclusão confirmada pelo servidor — quem chama cuida do foco quando a linha some. */
  onDeleted?: () => void;
};

/**
 * Etapa 07: consequências conferidas nas migrations e no hook. O anexo sai
 * antes (`deleteAttachmentIfExists`); o custo entra em `total_maintenance` e
 * nos gastos por mês (views sobre `maintenance_records`), então sai deles. O
 * trigger de manutenção só roda no *insert*: excluir não devolve a última
 * execução do item nem o odômetro do veículo — o texto diz isso em vez de
 * prometer um recálculo que não existe.
 */
export function DeleteMaintenanceRecordDialog({
  vehicleId,
  record,
  linkedItemName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteMaintenanceRecordDialogProps) {
  const deleteRecord = useDeleteMaintenanceRecord(vehicleId);
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
      await deleteRecord.mutateAsync(record.id);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  const effects = [
    record.cost != null ? "Sai do histórico e dos totais de gastos do veículo." : "Sai do histórico de serviços.",
    record.attachment ? "O anexo também é apagado." : null,
    linkedItemName
      ? `“${linkedItemName}” continua contando a partir da última execução registrada nele, mesmo que tenha sido esta.`
      : null,
    record.odometer_km != null ? "O odômetro do veículo não volta atrás." : null,
    "Essa ação não pode ser desfeita.",
  ]
    .filter(Boolean)
    .join(" ");

  const meta = [
    record.performed_on ? formatDateOnly(record.performed_on) : null,
    record.odometer_km != null ? formatKm(record.odometer_km) : "sem quilometragem",
    record.vendor,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
          <AlertDialogDescription>{effects}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm font-medium break-words text-text-primary">{record.name}</p>
            <p className="text-xs break-words text-text-secondary">{meta}</p>
            <p className="text-xs break-words text-text-secondary">
              {linkedItemName ? `Plano: ${linkedItemName}` : "Serviço avulso"}
            </p>
            {record.attachment && (
              <p className="text-xs break-all text-text-secondary">Anexo: {record.attachment.original_filename}</p>
            )}
          </div>
          <p className="shrink-0 font-mono text-sm text-text-primary">
            {/* Etapa 09: ausente não é zero — "Custo não informado" (antes "Sem custo"); zero salvo continua R$ 0,00. */}
            {record.cost != null ? (
              formatMoney(record.cost)
            ) : (
              <span className="font-sans text-text-secondary">Custo não informado</span>
            )}
          </p>
        </div>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteRecord.isPending}>
            {deleteRecord.isPending ? "Excluindo…" : "Excluir serviço"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
