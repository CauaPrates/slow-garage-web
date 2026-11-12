import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ActionLabel, Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, PageError } from "@/components/ui/feedback";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateIssueDialog } from "./CreateIssueDialog";
import { DeleteIssueDialog } from "./DeleteIssueDialog";
import { EditIssueDialog } from "./EditIssueDialog";
import { ISSUE_ROW_GRID, IssueListRow } from "./IssueListRow";
import { groupSummary, isOpenIssue } from "./issuePresentation";
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { useIssues, type IssueRow } from "./useIssues";

const OPEN_TITLE_ID = "issues-open-title";
const RESOLVED_TITLE_ID = "issues-resolved-title";

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
  titleId: string;
  title: string;
  issues: IssueRow[];
  emptyText: string;
  onEdit: (issue: IssueRow, trigger: HTMLElement | null) => void;
  onDelete: (issue: IssueRow, trigger: HTMLElement | null) => void;
};

function IssueGroup({ titleId, title, issues, emptyText, onEdit, onDelete }: GroupProps) {
  return (
    <section aria-labelledby={titleId} className={PANEL_CLASSNAME}>
      <PanelHeader
        title={title}
        titleId={titleId}
        action={<PanelCount>{groupSummary(issues.map((i) => i.status))}</PanelCount>}
      />
      {issues.length === 0 ? (
        <p className="p-(--panel-pad-x) text-sm text-text-secondary">{emptyText}</p>
      ) : (
        <>
          {/* As colunas de Problemas começam em `lg` (a situação precisa de espaço ao lado do título). */}
          <ListColumns className={cn("md:hidden lg:grid", ISSUE_ROW_GRID)}>
            <span>Problema</span>
            <span>Situação</span>
            <span className="text-right">Custo informado</span>
            <span />
          </ListColumns>
          <ul className="divide-y divide-border">
            {issues.map((issue) => (
              <IssueListRow key={issue.id} issue={issue} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/**
 * Etapa 08: cabeçalho com "Relatar problema", grupos Abertos e Resolvidos
 * com contagem por status. O corte é o de antes (e do `open_issues_count` do
 * dashboard): aberto, investigando, aguardando peça e em reparo são abertos;
 * resolvido e descartado vão para Resolvidos, com o descartado marcado como
 * tal. Dentro de cada grupo, a ordem da consulta (relato mais recente
 * primeiro). Mesmas consultas, chaves e invalidações; sem filtros nem
 * `?novo=1`, que a página nunca teve.
 */
export function IssuesPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [createOpen, setCreateOpen] = useState(false);
  // O problema aberto fica guardado aqui, não na linha: mudar o status troca a linha de grupo e a desmonta.
  const [editingIssue, setEditingIssue] = useState<IssueRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingIssue, setDeletingIssue] = useState<IssueRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const savedStatusRef = useRef<string | null>(null);

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const issuesQuery = useIssues(vehicleId ?? "");

  /** Volta ao "⋯" da linha se ele ainda existe; senão, ao título do grupo onde o problema está agora. */
  function restoreFocus(fallbackStatus: string | null) {
    const trigger = triggerRef.current;
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
      else focusHeadingIfLost(fallbackStatus && !isOpenIssue(fallbackStatus) ? RESOLVED_TITLE_ID : OPEN_TITLE_ID);
    });
  }

  if (vehicleLoading) {
    return (
      <Page aria-busy="true">
        <span className="sr-only">Carregando problemas…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="h-48 rounded-lg border border-border bg-surface" />
      </Page>
    );
  }

  if (vehicleError) {
    return <PageError message="Não foi possível carregar os problemas." onRetry={() => void refetchVehicle()} />;
  }

  if (!vehicle) {
    return <VehicleNotFound />;
  }

  const issues = issuesQuery.data ?? [];
  const openIssues = issues.filter((i) => isOpenIssue(i.status));
  const resolvedIssues = issues.filter((i) => !isOpenIssue(i.status));
  const noIssuesAtAll = issuesQuery.isSuccess && issues.length === 0;

  const rowHandlers = {
    onEdit: (issue: IssueRow, trigger: HTMLElement | null) => {
      triggerRef.current = trigger;
      savedStatusRef.current = null;
      setEditingIssue(issue);
      setEditOpen(true);
    },
    onDelete: (issue: IssueRow, trigger: HTMLElement | null) => {
      triggerRef.current = trigger;
      setDeletingIssue(issue);
      setDeleteOpen(true);
    },
  };

  return (
    <Page>
      <Breadcrumb items={[{ label: "Problemas" }]} />

      <PageHeader
        title="Problemas"
        description="Defeitos relatados neste veículo, do relato à resolução."
        actions={
          !noIssuesAtAll && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <ActionLabel short="Relatar" rest="problema" />
            </Button>
          )
        }
      />

      {issuesQuery.isLoading && (
        <div className={PANEL_CLASSNAME}>
          <SkeletonList label="Carregando problemas…" />
        </div>
      )}

      {issuesQuery.isError && (
        <div className={PANEL_CLASSNAME}>
          <InlineError onRetry={() => void issuesQuery.refetch()}>Não foi possível carregar os problemas.</InlineError>
        </div>
      )}

      {noIssuesAtAll && (
        <EmptyState
          icon={AlertTriangle}
          titleId={OPEN_TITLE_ID}
          title="Nenhum problema relatado neste veículo."
          action={<Button onClick={() => setCreateOpen(true)}>Relatar primeiro problema</Button>}
        >
          Ruído, vazamento, falha elétrica: relate quando aparecer e acompanhe até a resolução. Só o título é
          obrigatório.
        </EmptyState>
      )}

      {issuesQuery.isSuccess && issues.length > 0 && (
        <>
          <IssueGroup
            titleId={OPEN_TITLE_ID}
            title="Abertos"
            issues={openIssues}
            emptyText="Nenhum problema aberto."
            {...rowHandlers}
          />
          <IssueGroup
            titleId={RESOLVED_TITLE_ID}
            title="Resolvidos"
            issues={resolvedIssues}
            emptyText="Nenhum problema resolvido ou descartado ainda."
            {...rowHandlers}
          />
        </>
      )}

      <CreateIssueDialog
        vehicleId={vehicle.id}
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          // Aberto pelo estado vazio: o botão some quando o primeiro problema entra; o foco vai pro grupo.
          if (!open) focusHeadingIfLost(OPEN_TITLE_ID);
        }}
      />
      {editingIssue && (
        <EditIssueDialog
          vehicleId={vehicle.id}
          issue={editingIssue}
          open={editOpen}
          onSaved={(status) => {
            savedStatusRef.current = status;
          }}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) restoreFocus(savedStatusRef.current ?? editingIssue.status);
          }}
        />
      )}
      {deletingIssue && (
        <DeleteIssueDialog
          vehicleId={vehicle.id}
          issue={deletingIssue}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) restoreFocus(deletingIssue.status);
          }}
        />
      )}
    </Page>
  );
}
