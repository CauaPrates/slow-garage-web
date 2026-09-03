import { useState } from "react";
import { Pencil, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateOnly, formatKm } from "@/lib/format";
import { PRIORITY_LEVEL_LABELS } from "./schemas";
import { EditMaintenanceItemDialog } from "./EditMaintenanceItemDialog";
import { DeleteMaintenanceItemDialog } from "./DeleteMaintenanceItemDialog";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type MaintenanceItemCardProps = {
  vehicleId: string;
  item: MaintenanceItemWithStatus;
  onRegisterExecution: (itemId: string) => void;
};

const STATUS_LABEL: Record<string, string> = {
  overdue: "Vencido",
  due_soon: "Próximo",
  ok: "Em dia",
  planned: "Planejado",
};

const STATUS_CLASSNAME: Record<string, string> = {
  overdue: "border-error/40 bg-error/10 text-error",
  due_soon: "border-warning/40 bg-warning/10 text-warning",
  ok: "border-success/40 bg-success/10 text-success",
  planned: "border-border text-text-secondary",
};

function intervalDescription(item: MaintenanceItemWithStatus): string {
  const parts: string[] = [];
  if (item.interval_km != null) parts.push(`a cada ${formatKm(item.interval_km)}`);
  if (item.interval_months != null) parts.push(`a cada ${item.interval_months} meses`);
  return parts.join(" ou ");
}

export function MaintenanceItemCard({
  vehicleId,
  item,
  onRegisterExecution,
}: MaintenanceItemCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const status = item.status?.status ?? "planned";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-text-primary">{item.name}</p>
          <p className="text-sm text-text-secondary">
            {intervalDescription(item)}
            {item.category ? ` · ${item.category}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-xs",
            STATUS_CLASSNAME[status],
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-text-secondary">Prioridade</dt>
          <dd className="text-text-primary">{PRIORITY_LEVEL_LABELS[item.priority]}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Última vez</dt>
          <dd className="text-text-primary">
            {item.status?.last_service_date
              ? formatDateOnly(item.status.last_service_date)
              : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => onRegisterExecution(item.id)}>
          <Wrench className="h-4 w-4" aria-hidden="true" />
          Registrar execução
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar item do plano"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir item do plano"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <EditMaintenanceItemDialog
        vehicleId={vehicleId}
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteMaintenanceItemDialog
        vehicleId={vehicleId}
        item={item}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
