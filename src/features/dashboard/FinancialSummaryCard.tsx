import { formatMoney } from "@/lib/format";
import type { DashboardFinancialSummary } from "./types";

type FinancialSummaryCardProps = {
  summary: DashboardFinancialSummary | null;
};

const money = (value: number | null | undefined) => (value != null ? formatMoney(value) : "—");

/** RN-2: `null` em qualquer campo vira "—", nunca `0` inventado. */
export function FinancialSummaryCard({ summary }: FinancialSummaryCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-text-secondary">Total investido</dt>
          <dd className="font-mono text-text-primary">{money(summary?.total_invested)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Custo/km</dt>
          <dd className="font-mono text-text-primary">
            {summary?.cost_per_km != null ? `${formatMoney(summary.cost_per_km)}/km` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Gasto este mês</dt>
          <dd className="font-mono text-text-primary">{money(summary?.current_month_spend)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Gasto este ano</dt>
          <dd className="font-mono text-text-primary">{money(summary?.current_year_spend)}</dd>
        </div>
      </dl>

      <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-text-secondary">Gastos</dt>
          <dd className="font-mono text-text-primary">{money(summary?.total_expenses)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Manutenção</dt>
          <dd className="font-mono text-text-primary">{money(summary?.total_maintenance)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Combustível</dt>
          <dd className="font-mono text-text-primary">{money(summary?.total_fuel)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Itens de projeto</dt>
          <dd className="font-mono text-text-primary">{money(summary?.total_project_items)}</dd>
        </div>
      </dl>
    </div>
  );
}
