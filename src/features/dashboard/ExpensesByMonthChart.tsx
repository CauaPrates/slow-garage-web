import { useId, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardExpensesByMonth } from "./types";

type ExpensesByMonthChartProps = {
  data: DashboardExpensesByMonth[];
};

/** Meses visíveis antes de "Ver todos" — o histórico inteiro continua a um clique. */
const COLLAPSED_MONTHS = 6;

/**
 * Hue único (`--color-accent`) — é uma série só (magnitude ao longo do
 * tempo), não identidade de categoria, então a paleta categórica de 8 slots
 * não se aplica aqui (ver skill `dataviz`).
 *
 * Etapa 04: as colunas viraram linhas (mês · barra · valor), no mesmo trilho
 * fino dos outros gráficos da garagem. Coluna precisava de rolagem
 * horizontal quando o histórico crescia e espremia o rótulo no celular; a
 * linha cabe em 320px com o valor sempre escrito. Mais recente primeiro,
 * 6 meses e o resto em "Ver todos" (escala sempre do conjunto inteiro, como
 * no `VehicleInvestmentChart`). A view só traz meses com registro — mês
 * sem lançamento não aparece, e não é desenhado como zero. Barra de valor
 * zero fica vazia (sem largura mínima que pareça gasto).
 */
export function ExpensesByMonthChart({ data }: ExpensesByMonthChartProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Gasto por mês</h3>
        <p className="text-sm text-text-secondary">Nenhum gasto registrado ainda.</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.month.localeCompare(a.month));
  const maxAmount = Math.max(...sorted.map((d) => d.total_amount));
  const hasMore = sorted.length > COLLAPSED_MONTHS;
  const rows = expanded ? sorted : sorted.slice(0, COLLAPSED_MONTHS);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium text-text-primary">Gasto por mês</h3>
        <p className="text-xs text-text-secondary">
          Gastos, combustível, manutenção e itens de projeto, só nos meses com registro.
        </p>
      </div>
      {/* Subgrid: a coluna de valor tem a mesma largura em todas as linhas, então todo trilho tem o mesmo comprimento. */}
      <ul id={listId} className="grid grid-cols-[3.75rem_minmax(0,1fr)_auto] gap-x-3 gap-y-2.5">
        {rows.map((d) => {
          const date = parseISO(d.month);
          const widthPct = maxAmount > 0 && d.total_amount > 0 ? Math.max((d.total_amount / maxAmount) * 100, 1) : 0;
          return (
            <li key={d.month} className="col-span-3 grid grid-cols-subgrid items-center text-xs">
              <time dateTime={d.month} title={format(date, "MMMM 'de' yyyy", { locale: ptBR })} className="text-text-secondary">
                {format(date, "MMM/yy", { locale: ptBR })}
              </time>
              <div className="h-1.5 w-full bg-border" aria-hidden="true">
                <div className="h-1.5 bg-accent" style={{ width: `${widthPct}%` }} />
              </div>
              <span className="text-right font-mono text-text-primary">{formatMoney(d.total_amount)}</span>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={listId}
          className="flex min-h-11 items-center gap-1.5 self-start text-xs font-medium text-accent hover:underline"
        >
          {expanded ? "Ver menos" : `Ver todos os ${sorted.length} meses`}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-150",
              expanded && "rotate-180",
            )}
          />
        </button>
      )}
    </div>
  );
}
