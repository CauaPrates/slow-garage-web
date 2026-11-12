import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ActionLabel, Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState, InlineError, PageError } from "@/components/ui/feedback";
import { PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { CreateProjectItemDialog } from "./CreateProjectItemDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { ProjectListRow } from "./ProjectListRow";
import { isActiveProject, projectGroupSummary } from "./projectPresentation";
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { useProjects, type ProjectWithProgress } from "./useProjects";

const ACTIVE_TITLE_ID = "projects-active-title";
const CLOSED_TITLE_ID = "projects-closed-title";

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
      <PanelHeader
        title={title}
        titleId={titleId}
        description={description}
        action={<PanelCount>{projectGroupSummary(projects.map((p) => p.status))}</PanelCount>}
      />
      {projects.length === 0 ? (
        <p className="p-(--panel-pad-x) text-sm text-text-secondary">{emptyText}</p>
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
      <Page aria-busy="true">
        <span className="sr-only">Carregando projetos…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="h-48 rounded-lg border border-border bg-surface" />
      </Page>
    );
  }

  if (vehicleError) {
    return <PageError message="Não foi possível carregar os projetos." onRetry={() => void refetchVehicle()} />;
  }

  if (!vehicle) {
    return <VehicleNotFound />;
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
    <Page>
      <Breadcrumb items={[{ label: "Projetos" }]} />

      <PageHeader
        title="Projetos"
        description="Planos de evolução deste veículo, do item desejado ao instalado."
        actions={
          !noProjectsAtAll && (
            <Button onClick={() => setCreateProjectOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <ActionLabel short="Novo" rest="projeto" />
            </Button>
          )
        }
      />

      {needsProjectFirst && (
        <Alert
          tone="warning"
          action={
            <Button
              variant="ghost"
              onClick={() => {
                setNeedsProjectFirst(false);
                setCreateProjectOpen(true);
              }}
            >
              Criar projeto
            </Button>
          }
        >
          <p className="text-text-primary">Crie um projeto primeiro para usar o atalho "Upgrade".</p>
        </Alert>
      )}

      {projectsQuery.isLoading && (
        <div className={PANEL_CLASSNAME}>
          <SkeletonList label="Carregando projetos…" />
        </div>
      )}

      {projectsQuery.isError && (
        <div className={PANEL_CLASSNAME}>
          <InlineError onRetry={() => void projectsQuery.refetch()}>Não foi possível carregar os projetos.</InlineError>
        </div>
      )}

      {noProjectsAtAll && (
        <EmptyState
          icon={ClipboardList}
          titleId={ACTIVE_TITLE_ID}
          title="Nenhum projeto neste veículo."
          action={<Button onClick={() => setCreateProjectOpen(true)}>Criar meu primeiro projeto</Button>}
        >
          Motor, suspensão, restauração: um projeto reúne os itens que você quer, compra e instala, e mostra quanto já
          foi instalado. Só o nome é obrigatório.
        </EmptyState>
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
    </Page>
  );
}
