import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatConsumption, formatDateOnly, formatMoney } from "@/lib/format";
import { EditFuelLogDialog } from "./EditFuelLogDialog";
import { DeleteFuelLogDialog } from "./DeleteFuelLogDialog";
import type { FuelLogMetric } from "./useFuelLogs";

type FuelLogListItemProps = {
  vehicleId: string;
  log: FuelLogMetric;
};

/**
 * `fuel_log_metrics` tipa toda coluna como nullable (artefato de geração
 * de tipo de view), mas `id`/`occurred_on`/`odometer_km`/`liters`/
 * `total_amount` são `not null` na tabela de origem e a view é 1:1 —
 * na prática sempre vêm preenchidos.
 */
export function FuelLogListItem({ vehicleId, log }: FuelLogListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium text-text-primary">
          {formatDateOnly(log.occurred_on!)} · {log.liters} L
        </p>
        <p className="text-sm text-text-secondary">
          {formatMoney(log.total_amount!)}
          {log.station ? ` · ${log.station}` : ""}
          {!log.is_full_tank ? " · tanque não cheio" : ""}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {log.km_per_liter != null ? formatConsumption(log.km_per_liter) : "—"}
          {" · "}
          {log.cost_per_km != null ? `${formatMoney(log.cost_per_km)}/km` : "—"}
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar abastecimento"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir abastecimento"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <EditFuelLogDialog
        vehicleId={vehicleId}
        log={log}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteFuelLogDialog
        vehicleId={vehicleId}
        log={log}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
