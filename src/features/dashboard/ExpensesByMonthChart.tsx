import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatMoney } from "@/lib/format";
import type { DashboardExpensesByMonth } from "./types";

type ExpensesByMonthChartProps = {
  data: DashboardExpensesByMonth[];
};

/**
 * Coluna, hue único (`--color-accent`) — é uma série só (magnitude ao
 * longo do tempo), não identidade de categoria, então a paleta
 * categórica de 8 slots não se aplica aqui (ver skill `dataviz`,
 * "categórica é pra quando as séries SÃO o assunto"). Todo valor é
 * rotulado direto na barra — sem eixo, sem grid, porque com poucos
 * meses o rótulo direto já carrega o valor sozinho.
 */
export function ExpensesByMonthChart({ data }: ExpensesByMonthChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Gasto por mês</h3>
        <p className="text-sm text-text-secondary">Nenhum gasto registrado ainda.</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.total_amount));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-medium text-text-primary">Gasto por mês</h3>
      <div className="flex items-end gap-3 overflow-x-auto pb-1">
        {data.map((d) => {
          const heightPct = maxAmount > 0 ? (d.total_amount / maxAmount) * 100 : 0;
          return (
            <div key={d.month} className="flex shrink-0 flex-col items-center gap-1">
              <span className="text-xs whitespace-nowrap text-text-primary">
                {formatMoney(d.total_amount)}
              </span>
              <div className="flex h-24 w-8 items-end">
                <div
                  className="w-full rounded-t-[4px] bg-accent"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                  title={`${formatMoney(d.total_amount)} em ${format(parseISO(d.month), "MMMM 'de' yyyy", { locale: ptBR })}`}
                />
              </div>
              <span className="text-xs whitespace-nowrap text-text-secondary">
                {format(parseISO(d.month), "MMM/yy", { locale: ptBR })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
