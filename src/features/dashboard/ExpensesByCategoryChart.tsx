import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { formatCount, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/panel";
import type { DashboardExpensesByCategory } from "./types";

type ExpensesByCategoryChartProps = {
  data: DashboardExpensesByCategory[];
  /** Ação do estado vazio (ex.: "Registrar gasto"), quando quem usa tem uma. */
  emptyAction?: ReactNode;
  className?: string;
};

/** Categorias à vista antes de "Ver todas" — a mesma altura do gráfico por mês ao lado. */
const VISIBLE_CATEGORIES = 6;

/*
  A view (`vehicle_expenses_by_category`) é acumulada e só lê a tabela de
  gastos — abastecimento, manutenção e item de projeto não entram. O
  subtítulo diz isso, pra não ser lido como "gastos do mês" nem como a soma
  do indicador do topo.
*/
const DESCRIPTION =
  "Acumulado de todo o histórico, só lançamentos da tela Gastos. Não inclui combustível, manutenção nem itens de projeto.";

/**
 * Barras horizontais, maior valor primeiro, com rótulo, quantidade e valor
 * escritos ao lado — sem legenda nem hover.
 *
 * Etapa 05: uma cor neutra pra todas as barras e o laranja só na maior —
 * a paleta categórica de 8 cores não dizia nada que o rótulo já não dissesse.
 * Sem o balde "Outras" somado no cliente: as categorias além das 6 primeiras
 * ficam em "Ver todas", cada uma com o valor da view. Valor zero = trilho
 * vazio.
 */
export function ExpensesByCategoryChart({ data, emptyAction, className }: ExpensesByCategoryChartProps) {
  const [showAll, setShowAll] = useState(false);
  const moreId = useId();

  if (data.length === 0) {
    return (
      <Panel title="Gasto por categoria" description={DESCRIPTION} headingLevel="h3" className={className}>
        <div className="flex flex-col items-start gap-3 p-4">
          <p className="text-sm text-text-secondary">Nenhum lançamento na tela Gastos ainda.</p>
          {emptyAction}
        </div>
      </Panel>
    );
  }

  const sorted = [...data].sort((a, b) => b.total_amount - a.total_amount);
  const maxAmount = Math.max(0, ...sorted.map((row) => row.total_amount));
  const visible = sorted.slice(0, VISIBLE_CATEGORIES);
  const hidden = sorted.slice(VISIBLE_CATEGORIES);

  const renderRow = (row: DashboardExpensesByCategory, index: number) => {
    const widthPct = maxAmount > 0 ? (row.total_amount / maxAmount) * 100 : 0;
    return (
      <li key={row.category_slug} className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0 break-words text-text-primary">
            {row.category_label}
            <span className="text-xs text-text-secondary">
              {" "}
              · {formatCount(row.expense_count)} {row.expense_count === 1 ? "lançamento" : "lançamentos"}
            </span>
          </span>
          <span className="type-figure shrink-0 text-text-primary">{formatMoney(row.total_amount)}</span>
        </div>
        <div className="h-2 w-full rounded-sm bg-border" aria-hidden="true">
          <div
            className={cn("h-2 rounded-sm", index === 0 && row.total_amount > 0 ? "bg-accent" : "bg-text-secondary")}
            style={{ width: `${widthPct}%` }}
          />
        </div>
      </li>
    );
  };

  return (
    <Panel title="Gasto por categoria" description={DESCRIPTION} headingLevel="h3" className={className}>
      <ul className="flex flex-col gap-3.5 px-4 pt-4 pb-4" aria-label="Gasto por categoria, do maior para o menor">
        {visible.map(renderRow)}
      </ul>
      {hidden.length > 0 && (
        <>
          <ul id={moreId} hidden={!showAll} className="flex flex-col gap-3.5 px-4 pb-4">
            {hidden.map((row, i) => renderRow(row, VISIBLE_CATEGORIES + i))}
          </ul>
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            aria-expanded={showAll}
            aria-controls={moreId}
            className="mt-auto flex min-h-11 w-full items-center justify-between gap-2 border-t border-border px-4 py-2 text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
          >
            {showAll ? "Mostrar menos" : `Ver todas as ${sorted.length} categorias`}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-(--duration-fast)",
                showAll && "rotate-180",
              )}
            />
          </button>
        </>
      )}
    </Panel>
  );
}
