import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { PROJECT_STATUS_LABELS } from "./schemas";
import { EditProjectDialog } from "./EditProjectDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import type { ProjectWithProgress } from "./useProjects";

type ProjectCardProps = {
  vehicleId: string;
  project: ProjectWithProgress;
};

export function ProjectCard({ vehicleId, project }: ProjectCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const pctItems = project.progress?.pct_items_completed;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-150 hover:border-accent">
      <Link
        to={ROUTES.vehicleProject(vehicleId, project.id)}
        className="flex flex-col gap-2 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-text-primary">{project.name}</p>
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-text-secondary">
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          {pctItems != null ? `${Math.round(pctItems)}% dos itens concluídos` : "Sem item ainda"}
        </p>
      </Link>

      <div className="flex justify-end gap-2 p-4 pt-0">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar projeto"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir projeto"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <EditProjectDialog
        vehicleId={vehicleId}
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteProjectDialog
        vehicleId={vehicleId}
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
