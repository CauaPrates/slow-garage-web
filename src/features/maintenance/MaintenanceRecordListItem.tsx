import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { EditMaintenanceRecordDialog } from "./EditMaintenanceRecordDialog";
import { DeleteMaintenanceRecordDialog } from "./DeleteMaintenanceRecordDialog";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";
import type { MaintenanceRecordRow } from "./useMaintenanceRecords";

type MaintenanceRecordListItemProps = {
  vehicleId: string;
  record: MaintenanceRecordRow;
  items: MaintenanceItemWithStatus[];
};

export function MaintenanceRecordListItem({
  vehicleId,
  record,
  items,
}: MaintenanceRecordListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{record.name}</p>
        <p className="text-sm text-text-secondary">
          {formatDateOnly(record.performed_on)} · {formatKm(record.odometer_km)}
          {record.vendor ? ` · ${record.vendor}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-medium text-text-primary">
          {record.cost != null ? formatMoney(record.cost) : "—"}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar execução"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir execução"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditMaintenanceRecordDialog
        vehicleId={vehicleId}
        record={record}
        items={items}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteMaintenanceRecordDialog
        vehicleId={vehicleId}
        record={record}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
