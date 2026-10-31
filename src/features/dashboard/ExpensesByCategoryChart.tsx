import { formatMoney } from "@/lib/format";
import type { DashboardExpensesByCategory } from "./types";

type ExpensesByCategoryChartProps = {
  data: DashboardExpensesByCategory[];
};

const SERIES_COUNT = 8;

/**
 * Barra horizontal, paleta categórica de 8 slots em ordem fixa
 * (`--chart-series-1`..`8` em `tokens.css`, validada com
 * `validate_palette.js` contra as superfícies reais do app). Cada barra
 * já nasce com o nome da categoria escrito ao lado — não precisa de uma
 * legenda separada, porque a legenda *é* o rótulo direto aqui (não uma
 * peça de mapa cor→categoria como seria num gráfico de pizza). Além do
 * 8º slot, o resto dobra em "Outras" em vez de gerar uma 9ª cor (a
 * skill proíbe hue gerada — uma cor nova não é CVD-segura por
 * construção).
 */
export function ExpensesByCategoryChart({
  data,
}: ExpensesByCategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium text-text-primary">
          Gasto por categoria
        </h3>
        <p className="text-sm text-text-secondary">
          Nenhum gasto registrado ainda.
        </p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.total_amount - a.total_amount);
  const visible = sorted.slice(0, SERIES_COUNT);
  const rest = sorted.slice(SERIES_COUNT);
  const rows =
    rest.length > 0
      ? [
          ...visible,
          {
            category_slug: "other",
            category_label: "Outras",
            total_amount: rest.reduce((sum, r) => sum + r.total_amount, 0),
            expense_count: rest.reduce((sum, r) => sum + r.expense_count, 0),
          },
        ]
      : visible;

  const maxAmount = Math.max(...rows.map((r) => r.total_amount));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {/*
        Etapa 04: a view (`vehicle_expenses_by_category`) é acumulada e só lê a
        tabela de gastos — abastecimento, manutenção e item de projeto não
        entram. O subtítulo diz isso, pra não ser lido como "gastos do mês".
      */}
      <div className="mb-3 flex flex-col gap-0.5">
        <h3 className="text-sm font-medium text-text-primary">
          Gasto por categoria
        </h3>
        <p className="text-xs text-text-secondary">
          Acumulado de todo o histórico, só lançamentos da tela Gastos.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row, index) => {
          // Etapa 04: sem largura mínima pra valor zero (parecia gasto); valor real pequeno ainda aparece com 1%.
          const widthPct =
            maxAmount > 0 && row.total_amount > 0
              ? Math.max((row.total_amount / maxAmount) * 100, 1)
              : 0;
          const color =
            row.category_slug === "other"
              ? "var(--color-text-secondary)"
              : `var(--chart-series-${(index % SERIES_COUNT) + 1})`;
          return (
            <div key={row.category_slug} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 break-words text-text-primary">
                  {row.category_label}
                </span>
                <span className="shrink-0 font-mono text-text-primary">
                  {formatMoney(row.total_amount)}
                </span>
              </div>
              {/*
                Fase 024: trilho reto e fino, igual ao `VehicleInvestmentChart`
                — os dois ficam na mesma tela e a diferença de forma (cápsula
                grossa vs. fio) lia como dois sistemas. A **cor** continua
                categórica aqui, e isso é proposital: ali a cor é decoração,
                aqui ela mapeia categoria (ver DESIGN.md).
              */}
              <div className="h-1.5 w-full bg-border">
                <div
                  className="h-1.5"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  }}
                  title={`${row.category_label}: ${formatMoney(row.total_amount)} (${row.expense_count} gasto${row.expense_count === 1 ? "" : "s"})`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
