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
import { translatePostgresError } from "@/lib/postgresErrors";
import { intervalDescription, lastServiceLabel } from "./maintenancePresentation";
import { useDeleteMaintenanceItem } from "./useMaintenanceItems";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type DeleteMaintenanceItemDialogProps = {
  vehicleId: string;
  item: MaintenanceItemWithStatus;
  /** Serviços do histórico vinculados a este item; `null` quando o histórico não carregou. */
  linkedRecordsCount: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois da exclusão confirmada pelo servidor — quem chama cuida do foco quando a linha some. */
  onDeleted?: () => void;
};

/**
 * Etapa 07: mesma forma das exclusões de gasto e abastecimento. Consequências
 * conferidas na migration: exclusão de verdade da linha (ADR-031); a FK de
 * `maintenance_records.maintenance_item_id` é `on delete set null`, então os
 * serviços ficam no histórico, só sem vínculo; os alertas saem com o item
 * (`vehicle_alerts` vem de `maintenance_status`). Nenhuma cascata nova.
 */
export function DeleteMaintenanceItemDialog({
  vehicleId,
  item,
  linkedRecordsCount,
  open,
  onOpenChange,
  onDeleted,
}: DeleteMaintenanceItemDialogProps) {
  const deleteItem = useDeleteMaintenanceItem(vehicleId);
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
      await deleteItem.mutateAsync(item.id);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  const linked =
    linkedRecordsCount == null
      ? "Os serviços já registrados com ele continuam no histórico, sem vínculo com o plano."
      : linkedRecordsCount === 0
        ? "Nenhum serviço do histórico está vinculado a ele."
        : `${linkedRecordsCount === 1 ? "O serviço vinculado continua" : `Os ${linkedRecordsCount} serviços vinculados continuam`} no histórico, sem vínculo com o plano.`;
  const last = lastServiceLabel(item);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir item do plano?</AlertDialogTitle>
          <AlertDialogDescription>
            O item sai do plano e deixa de gerar vencimento e alertas. {linked} Para só parar de acompanhar sem
            apagar, desligue “Item ativo” na edição. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-0.5 rounded-md border border-border bg-bg px-3 py-2.5">
          <p className="text-sm font-medium break-words text-text-primary">{item.name}</p>
          <p className="text-xs text-text-secondary">
            {intervalDescription(item)}
            {item.is_active ? "" : " · inativo"}
          </p>
          <p className="text-xs text-text-secondary">Última execução: {last ?? "nenhuma registrada"}</p>
        </div>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteItem.isPending}>
            {deleteItem.isPending ? "Excluindo…" : "Excluir item"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
