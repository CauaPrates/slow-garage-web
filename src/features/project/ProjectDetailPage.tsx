import { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, Pencil, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateProjectItemDialog } from "./CreateProjectItemDialog";
import { DeleteProjectItemDialog } from "./DeleteProjectItemDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { EditProjectItemDialog } from "./EditProjectItemDialog";
import { PROJECT_ITEM_ROW_GRID, ProjectItemRow } from "./ProjectItemRow";
import { ProjectProgress } from "./ProjectProgress";
import {
  PROJECT_STATUS_PRESENTATION,
  STATUS_BADGE_CLASSNAME,
  itemStatusSummary,
  projectDateParts,
} from "./projectPresentation";
import { useProject } from "./useProjects";
import { useProjectItems, type ProjectItemRow as ProjectItem } from "./useProjectItems";

const ITEMS_TITLE_ID = "project-items-title";
const PAGE_CLASSNAME = "flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6";
const PANEL_CLASSNAME = "overflow-hidden rounded-lg border border-border bg-surface";

/** Foco pro título dos itens quando a linha que abriu o diálogo sumiu (item excluído). */
function focusItemsHeadingIfLost() {
  const startedAt = performance.now();
  const check = () => {
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
      if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
      return;
    }
    if (document.activeElement && document.activeElement !== document.body) return;
    const target = document.getElementById(ITEMS_TITLE_ID) ?? document.querySelector<HTMLElement>("main h1");
    if (!target) return;
    target.tabIndex = -1;
    target.focus();
  };
  requestAnimationFrame(check);
}

/**
 * Etapa 09: trilha → nome, situação, descrição e datas, com "Adicionar item"
 * e "Editar projeto" → "Progresso e custos" (números da `project_progress`) →
 * itens → notas do projeto. Mesma rota, consultas, chaves e invalidações; o
 * projeto vem de uma consulta e os itens de outra, então a falha de um não
 * apaga o outro. A exclusão do projeto continua na lista, como antes.
 */
export function ProjectDetailPage() {
  const { vehicleId, projectId } = useParams<{ vehicleId: string; projectId: string }>();
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  // O item aberto fica guardado aqui: a linha pode sumir (exclusão) com o diálogo ainda aberto.
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ProjectItem | null>(null);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const deletedRef = useRef(false);

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
  } = useVehicle(vehicleId ?? "");
  const projectQuery = useProject(vehicleId ?? "", projectId ?? "");
  const itemsQuery = useProjectItems(projectId ?? "");

  function restoreFocus() {
    const trigger = triggerRef.current;
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
      else focusItemsHeadingIfLost();
    });
  }

  if (vehicleLoading || projectQuery.isLoading) {
    return (
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando projeto…</span>
        <div className="h-14 w-64 animate-pulse rounded-md bg-surface" aria-hidden="true" />
        <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
      </div>
    );
  }

  if (vehicleError || projectQuery.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar o projeto.</p>
        <Button variant="outline" onClick={() => projectQuery.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!vehicle || !projectQuery.data) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-text-primary">Projeto não encontrado.</p>
        <Link
          to={vehicleId ? ROUTES.vehicleProjects(vehicleId) : ROUTES.home}
          className="text-sm text-accent underline"
        >
          Voltar para projetos
        </Link>
      </div>
    );
  }

  const project = projectQuery.data;
  const items = itemsQuery.data ?? [];
  const status = PROJECT_STATUS_PRESENTATION[project.status];
  const dates = projectDateParts(project, formatDateOnly);
  // O item da lista recarregada, quando existe — o anexo trocado aparece no diálogo aberto.
  const freshEditingItem = editingItem ? (items.find((i) => i.id === editingItem.id) ?? editingItem) : null;

  const rowHandlers = {
    onEdit: (item: ProjectItem, trigger: HTMLElement | null) => {
      triggerRef.current = trigger;
      setEditingItem(item);
      setEditItemOpen(true);
    },
    onDelete: (item: ProjectItem, trigger: HTMLElement | null) => {
      triggerRef.current = trigger;
      setDeletingItem(item);
      setDeleteItemOpen(true);
    },
  };

  const addItemButton = (
    <Button onClick={() => setCreateItemOpen(true)} className="shrink-0">
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span>
        Adicionar<span className="sr-only sm:not-sr-only"> item</span>
      </span>
    </Button>
  );

  return (
    <div className={PAGE_CLASSNAME}>
      <Breadcrumb
        items={[
          { label: "Projetos", href: ROUTES.vehicleProjects(vehicle.id) },
          { label: project.name },
        ]}
      />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight break-words text-text-primary">
              {project.name}
            </h1>
            <span className={cn(STATUS_BADGE_CLASSNAME, status.className)}>{status.label}</span>
          </div>
          {project.description ? (
            <p className="max-w-prose text-sm break-words whitespace-pre-line text-text-secondary">
              {project.description}
            </p>
          ) : null}
          <p className="text-xs text-text-secondary tabular-nums">
            {dates.length > 0 ? dates.join(" · ") : "Sem datas definidas"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {addItemButton}
          <Button variant="outline" onClick={() => setEditProjectOpen(true)} aria-label="Editar projeto">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline" aria-hidden="true">
              Editar projeto
            </span>
          </Button>
        </div>
      </header>

      <ProjectProgress progress={project.progress} items={itemsQuery.isSuccess ? items : null} />

      <section aria-labelledby={ITEMS_TITLE_ID} className={PANEL_CLASSNAME}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
          <h2 id={ITEMS_TITLE_ID} className="text-sm font-medium text-text-primary">
            Itens
          </h2>
          {itemsQuery.isSuccess && (
            <p aria-live="polite" className="text-xs text-text-secondary">
              {itemStatusSummary(items.map((i) => i.status))}
            </p>
          )}
        </div>

        {itemsQuery.isLoading && (
          <div className="flex flex-col gap-2 p-4" aria-busy="true">
            <span className="sr-only">Carregando itens…</span>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-state-hover" aria-hidden="true" />
            ))}
          </div>
        )}

        {itemsQuery.isError && (
          <div role="alert" className="flex flex-col items-start gap-2 p-4">
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
              Não foi possível carregar os itens. O progresso acima vem de outra consulta.
            </p>
            <Button variant="outline" onClick={() => itemsQuery.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {itemsQuery.isSuccess && items.length === 0 && (
          <div className="flex flex-col items-start gap-3 px-4 py-6">
            <p className="text-sm text-text-secondary">
              Nenhum item neste projeto ainda. Peças, serviços e ideias entram aqui, da lista de desejos ao instalado.
            </p>
            <Button variant="outline" onClick={() => setCreateItemOpen(true)}>
              Adicionar primeiro item
            </Button>
          </div>
        )}

        {itemsQuery.isSuccess && items.length > 0 && (
          <>
            <div
              aria-hidden="true"
              className={cn("hidden border-b border-border px-4 py-2 text-xs text-text-secondary xl:grid", PROJECT_ITEM_ROW_GRID)}
            >
              <span>Item</span>
              <span>Situação</span>
              <span className="text-right">Estimado</span>
              <span className="text-right">Real</span>
              <span />
            </div>
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <ProjectItemRow key={item.id} item={item} {...rowHandlers} />
              ))}
            </ul>
            {/* Celular: com lista longa, o "Adicionar" do cabeçalho fica lá em cima. */}
            <div className="border-t border-border px-2 py-1 sm:hidden">
              <Button variant="ghost" onClick={() => setCreateItemOpen(true)} className="w-full justify-start">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Adicionar item
              </Button>
            </div>
          </>
        )}
      </section>

      {project.notes && (
        <section aria-labelledby="project-notes-title" className={PANEL_CLASSNAME}>
          <h2 id="project-notes-title" className="border-b border-border px-4 py-3 text-sm font-medium text-text-primary">
            Notas do projeto
          </h2>
          <p className="px-4 py-3 text-sm break-words whitespace-pre-line text-text-primary">{project.notes}</p>
        </section>
      )}

      <CreateProjectItemDialog
        vehicleId={vehicle.id}
        projects={[{ id: project.id, name: project.name }]}
        fixedProjectId={project.id}
        open={createItemOpen}
        onOpenChange={(open) => {
          setCreateItemOpen(open);
          // Aberto pelo estado vazio: o botão some quando o primeiro item entra; o foco vai pros itens.
          if (!open) focusItemsHeadingIfLost();
        }}
      />
      <EditProjectDialog
        vehicleId={vehicle.id}
        project={project}
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
      />
      {freshEditingItem && (
        <EditProjectItemDialog
          item={freshEditingItem}
          projectName={project.name}
          open={editItemOpen}
          onOpenChange={(open) => {
            setEditItemOpen(open);
            if (!open) restoreFocus();
          }}
        />
      )}
      {deletingItem && (
        <DeleteProjectItemDialog
          item={deletingItem}
          open={deleteItemOpen}
          onDeleted={() => {
            deletedRef.current = true;
          }}
          onOpenChange={(open) => {
            setDeleteItemOpen(open);
            if (open) return;
            // Excluído: a linha some quando a lista recarrega (o hook não espera o refetch), então o "⋯" ainda
            // existe neste quadro — o foco vai direto pro título dos itens em vez de cair no <body> depois.
            if (deletedRef.current) {
              deletedRef.current = false;
              focusItemsHeadingIfLost();
            } else restoreFocus();
          }}
        />
      )}
    </div>
  );
}
