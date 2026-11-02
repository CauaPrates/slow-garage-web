import { formatMoney } from "@/lib/format";
import { ISSUE_STATUS_LABELS, ISSUE_STATUSES, OPEN_ISSUE_STATUSES } from "./schemas";

type IssueStatus = (typeof ISSUE_STATUSES)[number];

/**
 * Etapa 08: situação do problema em selo (texto + cor). Só "Aberto" pede
 * atenção (âmbar) — nada de vermelho para todo problema aberto. Os três
 * estados de trabalho em andamento ficam neutros, com borda forte;
 * "Resolvido" é o único verde; "Descartado" fica em Resolvidos (mesmo corte
 * do `open_issues_count`), mas tracejado e neutro, pra não parecer reparo
 * concluído. Prioridade nunca usa estas cores.
 */
export const ISSUE_STATUS_PRESENTATION: Record<IssueStatus, { label: string; className: string }> = {
  open: { label: ISSUE_STATUS_LABELS.open, className: "border-warning/40 bg-warning/10 text-warning" },
  investigating: { label: ISSUE_STATUS_LABELS.investigating, className: "border-border-strong text-text-primary" },
  waiting_part: { label: ISSUE_STATUS_LABELS.waiting_part, className: "border-border-strong text-text-primary" },
  in_repair: { label: ISSUE_STATUS_LABELS.in_repair, className: "border-border-strong text-text-primary" },
  resolved: { label: ISSUE_STATUS_LABELS.resolved, className: "border-success/40 bg-success/10 text-success" },
  dismissed: { label: ISSUE_STATUS_LABELS.dismissed, className: "border-dashed border-border-strong text-text-secondary" },
};

/** Mesmo corte de antes (e do `open_issues_count` do dashboard): os quatro primeiros status são "abertos". */
export function isOpenIssue(status: string): boolean {
  return OPEN_ISSUE_STATUSES.includes(status);
}

/** Plural da contagem por status; "investigando", "aguardando peça" e "em reparo" não flexionam. */
const STATUS_COUNT_LABEL: Record<IssueStatus, [string, string]> = {
  open: ["aberto", "abertos"],
  investigating: ["investigando", "investigando"],
  waiting_part: ["aguardando peça", "aguardando peça"],
  in_repair: ["em reparo", "em reparo"],
  resolved: ["resolvido", "resolvidos"],
  dismissed: ["descartado", "descartados"],
};

/** "3 problemas · 2 abertos · 1 aguardando peça" — contagem por status, na ordem do enum. */
export function groupSummary(statuses: string[]): string {
  if (statuses.length === 0) return "0 problemas";
  const parts = ISSUE_STATUSES.map((status) => {
    const count = statuses.filter((s) => s === status).length;
    if (count === 0) return null;
    return `${count} ${STATUS_COUNT_LABEL[status][count === 1 ? 0 : 1]}`;
  }).filter(Boolean);
  return [`${statuses.length} ${statuses.length === 1 ? "problema" : "problemas"}`, ...parts].join(" · ");
}

/** Custo informado no problema: zero salvo é R$ 0,00; ausente é `null` (a tela mostra "—"). */
export function issueCostLabel(cost: number | null): string | null {
  return cost != null ? formatMoney(cost) : null;
}
