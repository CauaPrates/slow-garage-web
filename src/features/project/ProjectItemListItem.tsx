import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import { PROJECT_ITEM_STATUS_LABELS } from "./schemas";
import { EditProjectItemDialog } from "./EditProjectItemDialog";
import { DeleteProjectItemDialog } from "./DeleteProjectItemDialog";
import type { ProjectItemRow } from "./useProjectItems";

type ProjectItemListItemProps = {
  item: ProjectItemRow;
};

export function ProjectItemListItem({ item }: ProjectItemListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const cost = item.actual_cost ?? item.estimated_cost;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{item.name}</p>
        <p className="text-sm text-text-secondary">
          {PROJECT_ITEM_STATUS_LABELS[item.status]} · {PRIORITY_LEVEL_LABELS[item.priority]}
          {item.vendor ? ` · ${item.vendor}` : ""}
        </p>
        {item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-accent underline"
          >
            Ver link <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-medium text-text-primary">
          {cost != null ? formatMoney(cost) : "—"}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar item"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir item"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditProjectItemDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteProjectItemDialog item={item} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
