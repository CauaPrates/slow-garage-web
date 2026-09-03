import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { CreateProjectItemDialog } from "./CreateProjectItemDialog";
import { ProjectCard } from "./ProjectCard";
import { useProjects } from "./useProjects";

export function ProjectsPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [needsProjectFirst, setNeedsProjectFirst] = useState(false);
  const [novoHandled, setNovoHandled] = useState(false);

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const projectsQuery = useProjects(vehicleId ?? "");

  useEffect(() => {
    if (novoHandled) return;
    if (searchParams.get("novo") !== "1") return;
    if (projectsQuery.isLoading) return; // espera o dado carregar antes de decidir o que abrir
    // eslint-disable-next-line react-hooks/set-state-in-effect -- decisão depende do resultado assíncrono da query (tem projeto ou não); não dá pra resolver com estado inicial preguiçoso como as outras páginas fazem com `?novo=1`
    setNovoHandled(true);
    const next = new URLSearchParams(searchParams);
    next.delete("novo");
    setSearchParams(next, { replace: true });
    if ((projectsQuery.data ?? []).length > 0) {
      setCreateItemOpen(true);
    } else {
      setNeedsProjectFirst(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, projectsQuery.isLoading]);

  if (vehicleLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar os projetos.</p>
        <Button variant="ghost" onClick={() => refetchVehicle()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-text-primary">Veículo não encontrado.</p>
        <Link to={ROUTES.home} className="text-sm text-accent underline">
          Voltar para a garagem
        </Link>
      </div>
    );
  }

  const projects = projectsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Projetos</h1>
          <p className="text-sm text-text-secondary">
            {vehicle.make} {vehicle.model}
          </p>
        </div>
        <Button onClick={() => setCreateProjectOpen(true)}>Novo projeto</Button>
      </div>

      {needsProjectFirst && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning sm:flex-row sm:items-center sm:justify-between">
          <p>Crie um projeto primeiro para usar o atalho "Upgrade".</p>
          <Button
            variant="ghost"
            onClick={() => {
              setNeedsProjectFirst(false);
              setCreateProjectOpen(true);
            }}
          >
            Criar projeto
          </Button>
        </div>
      )}

      {projectsQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {projectsQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar os projetos.</p>
          <Button variant="ghost" onClick={() => projectsQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-text-primary">Nenhum projeto ainda.</p>
          <Button onClick={() => setCreateProjectOpen(true)}>Criar meu primeiro projeto</Button>
        </div>
      )}

      {!projectsQuery.isLoading && !projectsQuery.isError && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} vehicleId={vehicle.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        vehicleId={vehicle.id}
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />
      <CreateProjectItemDialog
        vehicleId={vehicle.id}
        projects={projects}
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
      />
    </div>
  );
}
