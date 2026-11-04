import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle, ClipboardList, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { CreateProjectItemDialog } from "./CreateProjectItemDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { ProjectListRow } from "./ProjectListRow";
import { isActiveProject, projectGroupSummary } from "./projectPresentation";
import { useProjects, type ProjectWithProgress } from "./useProjects";

const ACTIVE_TITLE_ID = "projects-active-title";
const CLOSED_TITLE_ID = "projects-closed-title";
// Largura toda, como as outras telas redesenhadas.
const PAGE_CLASSNAME = "flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6";
const PANEL_CLASSNAME = "overflow-hidden rounded-lg border border-border bg-surface";

/**
 * Foco para depois que um diálogo fecha e o elemento que o abriu sumiu (a
 * linha trocou de grupo ou foi excluída): espera o diálogo sair e, se o foco
 * caiu no `<body>`, vai pro título do grupo.
 */
function focusHeadingIfLost(headingId: string) {
  const startedAt = performance.now();
  const check = () => {
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
      if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
      return;
    }
    if (document.activeElement && document.activeElement !== document.body) return;
    const target = document.getElementById(headingId) ?? document.querySelector<HTMLElement>("main h1");
    if (!target) return;
    target.tabIndex = -1;
    target.focus();
  };
  requestAnimationFrame(check);
}

type GroupProps = {
  vehicleId: string;
  titleId: string;
  title: string;
  description: string;
  projects: ProjectWithProgress[];
  emptyText: string;
  onEdit: (project: ProjectWithProgress, trigger: HTMLElement | null) => void;
  onDelete: (project: ProjectWithProgress, trigger: HTMLElement | null) => void;
};

function ProjectGroup({ vehicleId, titleId, title, description, projects, emptyText, onEdit, onDelete }: GroupProps) {
  return (
    <section aria-labelledby={titleId} className={PANEL_CLASSNAME}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <h2 id={titleId} className="text-sm font-medium text-text-primary">
            {title}
          </h2>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
        <p aria-live="polite" className="text-xs text-text-secondary">
          {projectGroupSummary(projects.map((p) => p.status))}
        </p>
      </div>
      {projects.length === 0 ? (
        <p className="px-4 py-4 text-sm text-text-secondary">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border">
          {projects.map((project) => (
            <ProjectListRow
              key={project.id}
              vehicleId={vehicleId}
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Etapa 09: cabeçalho com "Novo projeto" e dois painéis — **Ativos** (ideia,
 * planejado, em andamento, pausado: o mesmo corte de "Projetos ativos" do
 * dashboard) e **Encerrados** (concluídos e cancelados). Os dois aparecem
 * sempre que há projeto; nada fica escondido. Dentro de cada um, a ordem da
 * consulta (mais recente primeiro). Sem busca, filtro nem ordenação nova.
 *
 * Mesmas consultas, chaves e invalidações. `?novo=1` é tratado como antes:
 * com projeto, abre "Adicionar item" com o seletor de projeto; sem projeto,
 * mostra o aviso para criar um. (Nada no app aponta mais pra cá com `?novo=1`
 * — o "Upgrade" da folha Registrar vai para Modificações; o comportamento e o
 * texto do aviso ficaram como estavam, ADR-092.)
 */
export function ProjectsPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [needsProjectFirst, setNeedsProjectFirst] = useState(false);
  const [novoHandled, setNovoHandled] = useState(false);
  // O projeto aberto fica guardado aqui, não na linha: mudar o status troca a linha de grupo e a desmonta.
  const [editingProject, setEditingProject] = useState<ProjectWithProgress | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectWithProgress | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const savedStatusRef = useRef<string | null>(null);

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

  /** Volta ao "⋯" da linha se ele ainda existe; senão, ao título do grupo onde o projeto está agora. */
  function restoreFocus(fallbackStatus: string | null) {
    const trigger = triggerRef.current;
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
      else focusHeadingIfLost(fallbackStatus && !isActiveProject(fallbackStatus) ? CLOSED_TITLE_ID : ACTIVE_TITLE_ID);
    });
  }

  if (vehicleLoading) {
    return (
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando projetos…</span>
        <div className="h-14 w-56 animate-pulse rounded-md bg-surface" aria-hidden="true" />
        <div className="h-48 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
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
  const activeProjects = projects.filter((p) => isActiveProject(p.status));
  const closedProjects = projects.filter((p) => !isActiveProject(p.status));
  const noProjectsAtAll = projectsQuery.isSuccess && projects.length === 0;

  const rowHandlers = {
    onEdit: (project: ProjectWithProgress, trigger: HTMLElement | null) => {
      triggerRef.current = trigger;
      savedStatusRef.current = null;
      setEditingProject(project);
      setEditOpen(true);
    },
    onDelete: (project: ProjectWithProgress, trigger: HTMLElement | null) => {
      triggerRef.current = trigger;
      setDeletingProject(project);
      setDeleteOpen(true);
    },
  };

  return (
    <div className={PAGE_CLASSNAME}>
      <Breadcrumb items={[{ label: "Projetos" }]} />

      <header className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Projetos</h1>
          <p className="text-sm text-text-secondary">Planos de evolução deste veículo, do item desejado ao instalado.</p>
        </div>
        {!noProjectsAtAll && (
          <Button onClick={() => setCreateProjectOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {/* Um nó de texto só: no celular "Novo", nome completo pro leitor de tela. */}
            <span>
              Novo<span className="sr-only sm:not-sr-only"> projeto</span>
            </span>
          </Button>
        )}
      </header>

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
        <div className={PANEL_CLASSNAME} aria-busy="true">
          <span className="sr-only">Carregando projetos…</span>
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-state-hover" aria-hidden="true" />
            ))}
          </div>
        </div>
      )}

      {projectsQuery.isError && (
        <div role="alert" className={cn(PANEL_CLASSNAME, "flex flex-col items-start gap-2 p-4")}>
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            Não foi possível carregar os projetos.
          </p>
          <Button variant="outline" onClick={() => projectsQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {noProjectsAtAll && (
        <section
          aria-labelledby={ACTIVE_TITLE_ID}
          className={cn(PANEL_CLASSNAME, "flex flex-col items-center gap-3 px-6 py-12 text-center")}
        >
          <ClipboardList className="h-6 w-6 text-text-secondary" aria-hidden="true" />
          <h2 id={ACTIVE_TITLE_ID} className="font-medium text-text-primary">
            Nenhum projeto neste veículo.
          </h2>
          <p className="max-w-md text-sm text-text-secondary">
            Motor, suspensão, restauração: um projeto reúne os itens que você quer, compra e instala, e mostra quanto já
            foi instalado. Só o nome é obrigatório.
          </p>
          <Button onClick={() => setCreateProjectOpen(true)} className="mt-1">
            Criar meu primeiro projeto
          </Button>
        </section>
      )}

      {projectsQuery.isSuccess && projects.length > 0 && (
        <>
          <ProjectGroup
            vehicleId={vehicle.id}
            titleId={ACTIVE_TITLE_ID}
            title="Ativos"
            description="Ideia, planejado, em andamento e pausado — contam em Projetos ativos do painel."
            projects={activeProjects}
            emptyText="Nenhum projeto ativo."
            {...rowHandlers}
          />
          <ProjectGroup
            vehicleId={vehicle.id}
            titleId={CLOSED_TITLE_ID}
            title="Encerrados"
            description="Concluídos e cancelados."
            projects={closedProjects}
            emptyText="Nenhum projeto concluído ou cancelado."
            {...rowHandlers}
          />
        </>
      )}

      <CreateProjectDialog
        vehicleId={vehicle.id}
        open={createProjectOpen}
        onOpenChange={(open) => {
          setCreateProjectOpen(open);
          // Aberto pelo estado vazio ou pelo aviso: o botão some quando o primeiro projeto entra; o foco vai pro grupo.
          if (!open) focusHeadingIfLost(ACTIVE_TITLE_ID);
        }}
      />
      <CreateProjectItemDialog
        vehicleId={vehicle.id}
        projects={projects}
        open={createItemOpen}
        onOpenChange={(open) => {
          setCreateItemOpen(open);
          // Aberto pelo `?novo=1`, sem gatilho na tela: o foco vai pro título.
          if (!open) focusHeadingIfLost(ACTIVE_TITLE_ID);
        }}
      />
      {editingProject && (
        <EditProjectDialog
          vehicleId={vehicle.id}
          project={editingProject}
          open={editOpen}
          onSaved={(status) => {
            savedStatusRef.current = status;
          }}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) restoreFocus(savedStatusRef.current ?? editingProject.status);
          }}
        />
      )}
      {deletingProject && (
        <DeleteProjectDialog
          vehicleId={vehicle.id}
          project={deletingProject}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) restoreFocus(deletingProject.status);
          }}
        />
      )}
    </div>
  );
}
