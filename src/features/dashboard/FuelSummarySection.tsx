import { formatConsumption, formatMoney } from "@/lib/format";
import type { DashboardFuelSummary } from "./types";

type FuelSummarySectionProps = {
  summary: DashboardFuelSummary | null;
};

export function FuelSummarySection({ summary }: FuelSummarySectionProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-medium text-text-primary">Combustível</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
        <div>
          <dt className="text-text-secondary">Médio</dt>
          <dd className="font-mono text-text-primary">
            {summary?.avg_km_per_liter != null ? formatConsumption(summary.avg_km_per_liter) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Melhor</dt>
          <dd className="font-mono text-text-primary">
            {summary?.best_km_per_liter != null ? formatConsumption(summary.best_km_per_liter) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Pior</dt>
          <dd className="font-mono text-text-primary">
            {summary?.worst_km_per_liter != null ? formatConsumption(summary.worst_km_per_liter) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Preço médio</dt>
          <dd className="font-mono text-text-primary">
            {summary?.avg_price_per_liter != null ? `${formatMoney(summary.avg_price_per_liter)}/L` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">Litros no total</dt>
          <dd className="font-mono text-text-primary">
            {summary?.total_liters != null ? `${summary.total_liters} L` : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
