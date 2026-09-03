import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { useAddPaidInstallment, type FinancingRow } from "./useFinancing";
import { EditFinancingDialog } from "./EditFinancingDialog";
import { DeleteFinancingDialog } from "./DeleteFinancingDialog";

type FinancingCardProps = {
  vehicleId: string;
  financing: FinancingRow;
};

/** RN-1: `installments_remaining`/`outstanding_balance` só são lidos, nunca recalculados aqui. */
export function FinancingCard({ vehicleId, financing }: FinancingCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const addInstallment = useAddPaidInstallment(vehicleId);

  const isPaidOff = financing.installments_paid >= financing.installment_count;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div>
        <p className="text-sm text-text-secondary">Financiado</p>
        <p className="text-lg font-medium text-text-primary">
          {formatMoney(financing.financed_amount)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-text-secondary">Parcelas</p>
          <p className="font-medium text-text-primary">
            {financing.installments_paid} de {financing.installment_count} pagas
          </p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Valor da parcela</p>
          <p className="font-medium text-text-primary">{formatMoney(financing.installment_amount)}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Saldo devedor</p>
          <p className="font-medium text-text-primary">
            {financing.outstanding_balance != null ? formatMoney(financing.outstanding_balance) : "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Parcelas restantes</p>
          <p className="font-medium text-text-primary">
            {financing.installments_remaining ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Início</p>
          <p className="font-medium text-text-primary">{formatDateOnly(financing.started_on)}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Taxa de juros mensal</p>
          <p className="font-medium text-text-primary">
            {financing.interest_rate_monthly != null ? `${financing.interest_rate_monthly}%` : "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={isPaidOff || addInstallment.isPending}
          onClick={() => addInstallment.mutate(financing)}
        >
          {isPaidOff
            ? "Financiamento quitado"
            : addInstallment.isPending
              ? "Salvando…"
              : "+1 parcela paga"}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Editar financiamento" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir financiamento"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <EditFinancingDialog
        vehicleId={vehicleId}
        financing={financing}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteFinancingDialog
        vehicleId={vehicleId}
        financing={financing}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
