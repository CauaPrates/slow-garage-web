import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateOnly } from "@/lib/format";
import { PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import { ISSUE_STATUS_LABELS } from "./schemas";
import { EditIssueDialog } from "./EditIssueDialog";
import { DeleteIssueDialog } from "./DeleteIssueDialog";
import type { IssueRow } from "./useIssues";

type IssueListItemProps = {
  vehicleId: string;
  issue: IssueRow;
};

const STATUS_CLASSNAME: Record<string, string> = {
  open: "border-warning/40 bg-warning/10 text-warning",
  investigating: "border-warning/40 bg-warning/10 text-warning",
  waiting_part: "border-warning/40 bg-warning/10 text-warning",
  in_repair: "border-warning/40 bg-warning/10 text-warning",
  resolved: "border-success/40 bg-success/10 text-success",
  dismissed: "border-border text-text-secondary",
};

export function IssueListItem({ vehicleId, issue }: IssueListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0">
        <p className="font-medium text-text-primary">{issue.title}</p>
        <p className="text-sm text-text-secondary">
          {formatDateOnly(issue.reported_on)} · {PRIORITY_LEVEL_LABELS[issue.priority]}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={cn("rounded-full border px-2 py-0.5 text-xs", STATUS_CLASSNAME[issue.status])}>
          {ISSUE_STATUS_LABELS[issue.status]}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar problema"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir problema"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditIssueDialog
        vehicleId={vehicleId}
        issue={issue}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteIssueDialog
        vehicleId={vehicleId}
        issue={issue}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
