import { formatMoney } from "@/lib/format";
import {
  PROJECT_ITEM_STATUSES,
  PROJECT_ITEM_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
} from "./schemas";
import type { ProjectProgressRow } from "./useProjects";

type ProjectStatus = (typeof PROJECT_STATUSES)[number];
type ProjectItemStatus = (typeof PROJECT_ITEM_STATUSES)[number];

/** Selo de situação (texto + cor, nunca só cor) — mesma forma do selo de Problemas (etapa 08). */
export const STATUS_BADGE_CLASSNAME =
  "inline-flex shrink-0 items-center rounded-full border px-2 text-xs leading-5 font-medium whitespace-nowrap";

/**
 * Etapa 09: situação do projeto. "Em andamento" no acento (o mesmo papel de
 * "Ativo" no veículo); "Pausado" âmbar, porque parou; "Concluído" é o único
 * verde; "Cancelado" tracejado e neutro, pra nunca parecer concluído. Ideia e
 * planejado ficam neutros e se distinguem pelo texto.
 */
export const PROJECT_STATUS_PRESENTATION: Record<ProjectStatus, { label: string; className: string }> = {
  idea: { label: PROJECT_STATUS_LABELS.idea, className: "border-border-strong text-text-secondary" },
  planned: { label: PROJECT_STATUS_LABELS.planned, className: "border-border-strong text-text-primary" },
  in_progress: { label: PROJECT_STATUS_LABELS.in_progress, className: "border-accent/40 bg-accent/10 text-accent" },
  paused: { label: PROJECT_STATUS_LABELS.paused, className: "border-warning/40 bg-warning/10 text-warning" },
  completed: { label: PROJECT_STATUS_LABELS.completed, className: "border-success/40 bg-success/10 text-success" },
  cancelled: { label: PROJECT_STATUS_LABELS.cancelled, className: "border-dashed border-border-strong text-text-secondary" },
};

/**
 * Etapa 09: situação do item. Desejado e planejado neutros; "Comprado" no
 * acento (já está na mão, mas não conta como instalado); "Instalado" é o único
 * verde — é o que a `project_progress` conta como concluído; "Cancelado"
 * tracejado. Prioridade nunca usa estas cores.
 */
export const PROJECT_ITEM_STATUS_PRESENTATION: Record<ProjectItemStatus, { label: string; className: string }> = {
  wishlist: { label: PROJECT_ITEM_STATUS_LABELS.wishlist, className: "border-border-strong text-text-secondary" },
  planned: { label: PROJECT_ITEM_STATUS_LABELS.planned, className: "border-border-strong text-text-primary" },
  purchased: { label: PROJECT_ITEM_STATUS_LABELS.purchased, className: "border-accent/40 bg-accent/10 text-accent" },
  installed: { label: PROJECT_ITEM_STATUS_LABELS.installed, className: "border-success/40 bg-success/10 text-success" },
  cancelled: { label: PROJECT_ITEM_STATUS_LABELS.cancelled, className: "border-dashed border-border-strong text-text-secondary" },
};

/** Mesmo corte do `active_projects_count` do dashboard (`get_vehicle_dashboard`): ideia, planejado, em andamento e pausado. */
const ACTIVE_PROJECT_STATUSES: readonly string[] = ["idea", "planned", "in_progress", "paused"];

export function isActiveProject(status: string): boolean {
  return ACTIVE_PROJECT_STATUSES.includes(status);
}

const PROJECT_COUNT_LABEL: Record<ProjectStatus, [string, string]> = {
  idea: ["ideia", "ideias"],
  planned: ["planejado", "planejados"],
  in_progress: ["em andamento", "em andamento"],
  paused: ["pausado", "pausados"],
  completed: ["concluído", "concluídos"],
  cancelled: ["cancelado", "cancelados"],
};

const ITEM_COUNT_LABEL: Record<ProjectItemStatus, [string, string]> = {
  wishlist: ["na lista de desejos", "na lista de desejos"],
  planned: ["planejado", "planejados"],
  purchased: ["comprado", "comprados"],
  installed: ["instalado", "instalados"],
  cancelled: ["cancelado", "cancelados"],
};

function countSummary<S extends string>(
  statuses: string[],
  order: readonly S[],
  labels: Record<S, [string, string]>,
  noun: [string, string],
): string {
  if (statuses.length === 0) return `0 ${noun[1]}`;
  const parts = order
    .map((status) => {
      const count = statuses.filter((s) => s === status).length;
      return count === 0 ? null : `${count} ${labels[status][count === 1 ? 0 : 1]}`;
    })
    .filter(Boolean);
  return [`${statuses.length} ${statuses.length === 1 ? noun[0] : noun[1]}`, ...parts].join(" · ");
}

/** "3 projetos · 1 ideia · 2 em andamento" — contagem por status, na ordem do enum. */
export function projectGroupSummary(statuses: string[]): string {
  return countSummary(statuses, PROJECT_STATUSES, PROJECT_COUNT_LABEL, ["projeto", "projetos"]);
}

/** "6 itens · 2 instalados · 1 comprado · 1 cancelado" — contagem real dos itens carregados. */
export function itemStatusSummary(statuses: string[]): string {
  return countSummary(statuses, PROJECT_ITEM_STATUSES, ITEM_COUNT_LABEL, ["item", "itens"]);
}

const PERCENT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** O percentual como a view entrega (uma casa), sem arredondar de novo: 40 → "40%", 29.7 → "29,7%". */
export function formatPercent(value: number): string {
  return `${PERCENT.format(value)}%`;
}

/** Ausente é `null` (a tela diz "não informado"/"—"); zero salvo é R$ 0,00. */
export function moneyOrNull(value: number | null | undefined): string | null {
  return value != null ? formatMoney(value) : null;
}

export type ProgressState =
  | { kind: "unknown" }
  | { kind: "empty" }
  | { kind: "ready"; completed: number; total: number; pct: number };

/**
 * Lê o progresso **como a `project_progress` entrega**, sem refazer a conta:
 * concluídos = itens Instalados; denominador = itens não cancelados. Sem item
 * não cancelado a view devolve `pct_items_completed` nulo — "empty", nunca 0%
 * nem 100%. Sem linha de progresso, "unknown".
 */
export function readProgress(progress: ProjectProgressRow | null): ProgressState {
  if (!progress || progress.total_items == null) return { kind: "unknown" };
  if (progress.total_items === 0 || progress.pct_items_completed == null) return { kind: "empty" };
  return {
    kind: "ready",
    completed: progress.completed_items ?? 0,
    total: progress.total_items,
    pct: progress.pct_items_completed,
  };
}

/** "2 de 5 itens instalados" — o texto que acompanha a barra. */
export function progressLabel(state: Extract<ProgressState, { kind: "ready" }>): string {
  return `${state.completed} de ${state.total} ${state.total === 1 ? "item instalado" : "itens instalados"}`;
}

/** Datas do projeto preenchidas, na ordem do formulário. */
export function projectDateParts(
  project: { started_on: string | null; target_date: string | null; completed_on: string | null },
  formatDate: (iso: string) => string,
): string[] {
  return [
    project.started_on ? `Início ${formatDate(project.started_on)}` : null,
    project.target_date ? `Data alvo ${formatDate(project.target_date)}` : null,
    // "Conclusão", não "Concluído em": a data é independente do status.
    project.completed_on ? `Conclusão ${formatDate(project.completed_on)}` : null,
  ].filter((part): part is string => part !== null);
}
