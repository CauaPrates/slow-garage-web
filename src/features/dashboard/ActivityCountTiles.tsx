import { Link } from "react-router-dom";
import { AlertTriangle, ClipboardList } from "lucide-react";
import { ROUTES } from "@/lib/routes";

type ActivityCountTilesProps = {
  vehicleId: string;
  openIssuesCount: number;
  activeProjectsCount: number;
};

export function ActivityCountTiles({
  vehicleId,
  openIssuesCount,
  activeProjectsCount,
}: ActivityCountTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Link
        to={ROUTES.vehicleIssues(vehicleId)}
        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:border-accent"
      >
        <AlertTriangle className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        <div>
          <p className="text-lg font-medium text-text-primary">{openIssuesCount}</p>
          <p className="text-xs text-text-secondary">Problemas em aberto</p>
        </div>
      </Link>
      <Link
        to={ROUTES.vehicleProjects(vehicleId)}
        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:border-accent"
      >
        <ClipboardList className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        <div>
          <p className="text-lg font-medium text-text-primary">{activeProjectsCount}</p>
          <p className="text-xs text-text-secondary">Projetos ativos</p>
        </div>
      </Link>
    </div>
  );
}
