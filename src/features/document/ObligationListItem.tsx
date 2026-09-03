import { useState } from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateOnly, formatMoney, todayDateOnly } from "@/lib/format";
import { OBLIGATION_KIND_LABELS } from "./schemas";
import type { ObligationRow } from "./useObligations";
import { EditObligationDialog } from "./EditObligationDialog";
import { DeleteObligationDialog } from "./DeleteObligationDialog";
import { MarkObligationPaidDialog } from "./MarkObligationPaidDialog";

type ObligationListItemProps = {
  vehicleId: string;
  obligation: ObligationRow;
};

export function ObligationListItem({ vehicleId, obligation }: ObligationListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);

  const isPaid = obligation.paid_on != null;
  const isOverdue = !isPaid && obligation.due_on < todayDateOnly();

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{obligation.label}</p>
        <p className="text-sm text-text-secondary">
          {OBLIGATION_KIND_LABELS[obligation.kind]}
          {obligation.amount != null ? ` · ${formatMoney(obligation.amount)}` : ""}
        </p>
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            isPaid ? "text-success" : isOverdue ? "text-error" : "text-text-secondary",
          )}
        >
          {isPaid && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
          {isPaid
            ? `Paga em ${formatDateOnly(obligation.paid_on as string)}`
            : `${isOverdue ? "Vencida em " : "Vence em "}${formatDateOnly(obligation.due_on)}`}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex gap-1">
          {!isPaid && (
            <Button variant="ghost" onClick={() => setMarkPaidOpen(true)}>
              Marcar como paga
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar obrigação"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir obrigação"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditObligationDialog
        vehicleId={vehicleId}
        obligation={obligation}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteObligationDialog
        vehicleId={vehicleId}
        obligation={obligation}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <MarkObligationPaidDialog
        vehicleId={vehicleId}
        obligation={obligation}
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
      />
    </div>
  );
}
