import { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateIssueDialog } from "./CreateIssueDialog";
import { DeleteIssueDialog } from "./DeleteIssueDialog";
import { EditIssueDialog } from "./EditIssueDialog";
import { ISSUE_ROW_GRID, IssueListRow } from "./IssueListRow";
import { groupSummary, isOpenIssue } from "./issuePresentation";
import { useIssues, type IssueRow } from "./useIssues";

const OPEN_TITLE_ID = "issues-open-title";
const RESOLVED_TITLE_ID = "issues-resolved-title";
// Largura toda, como as outras telas redesenhadas; em monitor largo quem se ajusta são as colunas.
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
        <h2 id={titleId} className="text-sm font-medium text-text-primary">
          {title}
        </h2>
        <p aria-live="polite" className="text-xs text-text-secondary">
          {groupSummary(issues.map((i) => i.status))}
        </p>
      </div>
      {issues.length === 0 ? (
        <p className="px-4 py-4 text-sm text-text-secondary">{emptyText}</p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className={cn("hidden border-b border-border px-4 py-2 text-xs text-text-secondary lg:grid", ISSUE_ROW_GRID)}
          >
            <span>Problema</span>
            <span>Situação</span>
            <span className="text-right">Custo informado</span>
            <span />
          </div>
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
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando problemas…</span>
        <div className="h-14 w-56 animate-pulse rounded-md bg-surface" aria-hidden="true" />
        <div className="h-48 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar os problemas.</p>
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
    <div className={PAGE_CLASSNAME}>
      <Breadcrumb items={[{ label: "Problemas" }]} />

      <header className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Problemas</h1>
          <p className="text-sm text-text-secondary">Defeitos relatados neste veículo, do relato à resolução.</p>
        </div>
        {!noIssuesAtAll && (
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {/* Um nó de texto só, como em Abastecimentos: no celular "Relatar", nome completo pro leitor de tela. */}
            <span>
              Relatar<span className="sr-only sm:not-sr-only"> problema</span>
            </span>
          </Button>
        )}
      </header>

      {issuesQuery.isLoading && (
        <div className={PANEL_CLASSNAME} aria-busy="true">
          <span className="sr-only">Carregando problemas…</span>
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-state-hover" aria-hidden="true" />
            ))}
          </div>
        </div>
      )}

      {issuesQuery.isError && (
        <div role="alert" className={cn(PANEL_CLASSNAME, "flex flex-col items-start gap-2 p-4")}>
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            Não foi possível carregar os problemas.
          </p>
          <Button variant="outline" onClick={() => issuesQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {noIssuesAtAll && (
        <section
          aria-labelledby={OPEN_TITLE_ID}
          className={cn(PANEL_CLASSNAME, "flex flex-col items-center gap-3 px-6 py-12 text-center")}
        >
          <AlertTriangle className="h-6 w-6 text-text-secondary" aria-hidden="true" />
          <h2 id={OPEN_TITLE_ID} className="font-medium text-text-primary">
            Nenhum problema relatado neste veículo.
          </h2>
          <p className="max-w-md text-sm text-text-secondary">
            Ruído, vazamento, falha elétrica: relate quando aparecer e acompanhe até a resolução. Só o título é
            obrigatório.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-1">
            Relatar primeiro problema
          </Button>
        </section>
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
    </div>
  );
}
