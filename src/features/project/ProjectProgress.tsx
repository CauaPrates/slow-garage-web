import { PANEL_CLASSNAME, PanelHeader } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import {
  formatPercent,
  moneyOrNull,
  progressLabel,
  readProgress,
  type ProgressState,
} from "./projectPresentation";
import type { ProjectItemRow } from "./useProjectItems";
import type { ProjectProgressRow } from "./useProjects";

/**
 * Barra simples: a fração de itens instalados que a view calculou. Decorativa
 * pro leitor de tela (`aria-hidden`) — o texto ao lado diz a mesma coisa. Sem
 * mínimo artificial: 0% é trilho vazio.
 */
export function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div aria-hidden="true" className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}>
      <div className="h-full rounded-full bg-success" style={{ width: `${width}%` }} />
    </div>
  );
}

/** Linha de progresso da lista: barra + "2 de 5 itens instalados · 40%", ou o motivo de não haver número. */
export function ProgressSummary({ state }: { state: ProgressState }) {
  if (state.kind === "unknown") {
    return <p className="text-xs text-text-secondary">Progresso indisponível</p>;
  }
  if (state.kind === "empty") {
    return <p className="text-xs text-text-secondary">Sem itens a medir</p>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-baseline justify-between gap-2 text-xs text-text-secondary">
        <span>{progressLabel(state)}</span>
        <span className="type-figure text-text-primary">{formatPercent(state.pct)}</span>
      </p>
      <ProgressBar pct={state.pct} />
    </div>
  );
}

/** Um valor rotulado; ausente diz por quê, em texto, em vez de virar R$ 0,00. */
function Metric({ label, value, emptyText, note }: { label: string; value: string | null; emptyText: string; note?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dl className="flex items-baseline justify-between gap-3">
        <dt className="text-text-secondary">{label}</dt>
        <dd className="text-right">
          {value ? (
            <span className="type-figure text-text-primary">{value}</span>
          ) : (
            <span className="text-text-secondary">{emptyText}</span>
          )}
        </dd>
      </dl>
      {note && <p className="text-xs text-text-secondary">{note}</p>}
    </div>
  );
}

type ProjectProgressPanelProps = {
  progress: ProjectProgressRow | null;
  /** Itens carregados — `null` enquanto carregam ou se a lista falhou (o painel fica só com o que a view deu). */
  items: ProjectItemRow[] | null;
};

export const PROJECT_PROGRESS_TITLE_ID = "project-progress-title";

/**
 * Etapa 09: progresso e referências financeiras do projeto. Tudo o que é
 * número vem pronto da `project_progress` (RN-1): instalados ÷ itens não
 * cancelados, somas estimada e real dos não cancelados e custo real ÷
 * orçamento. O que vem dos itens carregados é só contagem (quantos comprados,
 * cancelados, com valor informado) — nenhuma fórmula refeita aqui.
 *
 * A view soma com `coalesce(…, 0)`: sem nenhum valor informado ela devolve 0.
 * Com os itens à mão, "Nenhum informado" aparece no lugar de R$ 0,00; sem
 * eles, vale o número da view.
 */
export function ProjectProgress({ progress, items }: ProjectProgressPanelProps) {
  const state = readProgress(progress);
  const active = items?.filter((i) => i.status !== "cancelled") ?? null;
  const purchased = items?.filter((i) => i.status === "purchased").length ?? 0;
  const cancelled = items?.filter((i) => i.status === "cancelled").length ?? 0;
  const withActual = active ? active.filter((i) => i.actual_cost != null).length : null;
  const withEstimate = active ? active.filter((i) => i.estimated_cost != null).length : null;

  const budget = progress?.budget ?? null;
  const pctBudget = progress?.pct_budget_used ?? null;
  const noActual = withActual === 0;
  const noEstimate = withEstimate === 0;
  const hasSums = progress != null && state.kind !== "unknown";
  const actual = hasSums && !noActual ? moneyOrNull(progress.total_actual) : null;
  const estimated = hasSums && !noEstimate ? moneyOrNull(progress.total_estimated) : null;

  let emptyText = "Sem itens a medir.";
  if (items && items.length === 0) emptyText = "Nenhum item ainda. O progresso começa a contar com o primeiro item.";
  else if (items && items.length > 0 && cancelled === items.length) emptyText = "Todos os itens estão cancelados — não há o que medir.";

  // Uma explicação só (a regra completa), com a contagem deste projeto pendurada nela — antes eram duas
  // frases seguidas dizendo a mesma coisa (revisão da etapa 09).
  const counts = [
    purchased > 0 ? `${purchased} ${purchased === 1 ? "comprado" : "comprados"}` : null,
    cancelled > 0 ? `${cancelled} ${cancelled === 1 ? "cancelado" : "cancelados"}` : null,
  ].filter(Boolean);
  const rule = "Conta só o que está Instalado; comprado ainda não conta e cancelado sai da conta";
  // Sem número a explicar (sem item, todos cancelados), a contagem só repetiria o texto do estado vazio.
  const ruleText =
    state.kind === "ready" && counts.length > 0 ? `${rule} — aqui, ${counts.join(" e ")}.` : `${rule}.`;

  const activeCount = active?.length ?? 0;
  const actualNote =
    [
      withActual != null && activeCount > 0
        ? `${withActual} de ${activeCount} ${activeCount === 1 ? "item com valor" : "itens com valor"}`
        : null,
      pctBudget != null && !noActual ? `${formatPercent(pctBudget)} do orçamento` : null,
      budget === 0 && !noActual ? "sem percentual com orçamento zero" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Soma do custo real dos itens não cancelados, em qualquer situação.";
  const estimateNote =
    withEstimate != null && activeCount > 0
      ? `${withEstimate} de ${activeCount} ${activeCount === 1 ? "item com estimativa" : "itens com estimativa"}`
      : undefined;

  return (
    <section aria-labelledby={PROJECT_PROGRESS_TITLE_ID} className={PANEL_CLASSNAME}>
      <PanelHeader
        title="Progresso e custos"
        titleId={PROJECT_PROGRESS_TITLE_ID}
        action={<p className="type-caption pt-0.5 text-text-secondary">Medidos pelos itens não cancelados</p>}
      />

      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="flex flex-col gap-2.5 px-(--panel-pad-x) py-4">
          <p className="text-xs text-text-secondary">Itens instalados</p>
          {state.kind === "ready" ? (
            <>
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="type-figure text-2xl text-text-primary">
                  {state.completed} de {state.total}
                </span>
                <span className="text-sm text-text-secondary tabular-nums">{formatPercent(state.pct)}</span>
              </p>
              <ProgressBar pct={state.pct} className="h-2" />
            </>
          ) : (
            <p className="text-sm text-text-secondary">
              {state.kind === "unknown" ? "Progresso indisponível no momento." : emptyText}
            </p>
          )}
          <p className="text-xs text-text-secondary">{ruleText}</p>
        </div>

        <div className="flex flex-col gap-3 px-(--panel-pad-x) py-4 text-sm">
          <Metric label="Orçamento" value={moneyOrNull(budget)} emptyText="Não definido" />
          <Metric label="Custo real" value={actual} emptyText={noActual ? "Nenhum informado" : "—"} note={actualNote} />
          <Metric
            label="Custo estimado"
            value={estimated}
            emptyText={noEstimate ? "Nenhum informado" : "—"}
            note={estimateNote}
          />
        </div>
      </div>

      <p className="type-caption border-t border-border px-(--panel-pad-x) py-(--panel-pad-y) text-text-secondary">
        Nos totais do veículo entra só o custo real de itens Instalados (com data, no mês dessa data). Estimativas não
        entram.
      </p>
    </section>
  );
}
