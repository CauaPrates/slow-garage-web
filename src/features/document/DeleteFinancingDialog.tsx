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
import { formatCount, formatMoney } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { useDeleteFinancing, type FinancingRow } from "./useFinancing";

type DeleteFinancingDialogProps = {
  vehicleId: string;
  financing: FinancingRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

/**
 * Etapa 11: as consequências verificadas — a linha de `financings` sai com o
 * contrato e a contagem de parcelas (não há tabela de parcelas). Nada aqui
 * gera alerta, anexo, evento de Histórico ou gasto; o que foi lançado em
 * Gastos na categoria Financiamento é outro registro e fica.
 */
export function DeleteFinancingDialog({ vehicleId, financing, open, onOpenChange, onDeleted }: DeleteFinancingDialogProps) {
  const deleteFinancing = useDeleteFinancing(vehicleId);
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
      await deleteFinancing.mutateAsync(financing.id);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  const count = financing.installment_count;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir financiamento?</AlertDialogTitle>
          <AlertDialogDescription>
            O contrato e a contagem de parcelas pagas são apagados. Gastos lançados na categoria Financiamento
            continuam em Gastos. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogRecord
          value={financing.financed_amount != null ? formatMoney(financing.financed_amount) : undefined}
        >
          <p className="text-sm font-medium text-text-primary">Financiamento deste veículo</p>
          <p className="text-xs text-text-secondary">
            {formatCount(financing.installments_paid)}
            {count != null ? ` de ${formatCount(count)}` : ""} {financing.installments_paid === 1 ? "parcela paga" : "parcelas pagas"}
            {financing.installment_amount != null ? ` · parcela de ${formatMoney(financing.installment_amount)}` : ""}
          </p>
        </AlertDialogRecord>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteFinancing.isPending}>
            {deleteFinancing.isPending ? "Excluindo…" : "Excluir financiamento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
