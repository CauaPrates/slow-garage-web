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
import { formatMoney } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { OBLIGATION_KIND_LABELS } from "./schemas";
import { useDeleteObligation, type ObligationRow } from "./useObligations";

type DeleteObligationDialogProps = {
  vehicleId: string;
  obligation: ObligationRow;
  dateLabel: string;
  /** A obrigação está hoje em `vehicle_alerts` (pendente, vencida ou a vencer em 30 dias). */
  hasAlert: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

/**
 * RN da ADR-031: exclusão de verdade. Etapa 11: o registro no cartão comum e
 * as consequências verificadas — obrigação não tem anexo, não entra no
 * Histórico nem em total; o único reflexo fora daqui é o alerta, quando há.
 */
export function DeleteObligationDialog({
  vehicleId,
  obligation,
  dateLabel,
  hasAlert,
  open,
  onOpenChange,
  onDeleted,
}: DeleteObligationDialogProps) {
  const deleteObligation = useDeleteObligation(vehicleId);
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
      await deleteObligation.mutateAsync(obligation.id);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir obrigação?</AlertDialogTitle>
          <AlertDialogDescription>
            Sai desta lista
            {hasAlert ? ", e o alerta dela sai do dashboard, da Manutenção e do sino" : ""}. Essa ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogRecord value={obligation.amount != null ? formatMoney(obligation.amount) : undefined}>
          <p className="text-sm font-medium break-words text-text-primary">{obligation.label}</p>
          <p className="text-xs text-text-secondary">
            {OBLIGATION_KIND_LABELS[obligation.kind]} · {dateLabel}
          </p>
        </AlertDialogRecord>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteObligation.isPending}>
            {deleteObligation.isPending ? "Excluindo…" : "Excluir obrigação"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
