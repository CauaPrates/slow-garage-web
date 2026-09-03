import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateProjectItemDialog } from "./CreateProjectItemDialog";
import { ProjectItemListItem } from "./ProjectItemListItem";
import { ProjectProgress } from "./ProjectProgress";
import { PROJECT_STATUS_LABELS } from "./schemas";
import { useProject } from "./useProjects";
import { useProjectItems } from "./useProjectItems";

export function ProjectDetailPage() {
  const { vehicleId, projectId } = useParams<{ vehicleId: string; projectId: string }>();
  const [createItemOpen, setCreateItemOpen] = useState(false);

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
  } = useVehicle(vehicleId ?? "");
  const projectQuery = useProject(vehicleId ?? "", projectId ?? "");
  const itemsQuery = useProjectItems(projectId ?? "");

  if (vehicleLoading || projectQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (vehicleError || projectQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar o projeto.</p>
        <Button variant="ghost" onClick={() => projectQuery.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!vehicle || !projectQuery.data) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-text-primary">Projeto não encontrado.</p>
        <Link to={vehicleId ? ROUTES.vehicleProjects(vehicleId) : ROUTES.home} className="text-sm text-accent underline">
          Voltar para projetos
        </Link>
      </div>
    );
  }

  const project = projectQuery.data;
  const items = itemsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">{project.name}</h1>
          <p className="text-sm text-text-secondary">
            {vehicle.make} {vehicle.model} · {PROJECT_STATUS_LABELS[project.status]}
          </p>
        </div>
        <Button onClick={() => setCreateItemOpen(true)}>Adicionar item</Button>
      </div>

      <ProjectProgress progress={project.progress} />

      {itemsQuery.isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {itemsQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar os itens.</p>
          <Button variant="ghost" onClick={() => itemsQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-text-primary">Nenhum item neste projeto ainda.</p>
          <Button onClick={() => setCreateItemOpen(true)}>Adicionar primeiro item</Button>
        </div>
      )}

      {!itemsQuery.isLoading && !itemsQuery.isError && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ProjectItemListItem key={item.id} item={item} />
          ))}
        </div>
      )}

      <CreateProjectItemDialog
        vehicleId={vehicle.id}
        projects={[{ id: project.id, name: project.name }]}
        fixedProjectId={project.id}
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
      />
    </div>
  );
}
