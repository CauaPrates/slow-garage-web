import { formatConsumption, formatMoney } from "@/lib/format";

type FuelSummaryCardProps = {
  avgKmPerLiter: number | null;
  bestKmPerLiter: number | null;
  worstKmPerLiter: number | null;
  costPerKm: number | null;
};

/** Todos os números vêm prontos das views — "—" é a resposta correta quando o banco não tem confiança (RN-1), nunca uma estimativa. */
export function FuelSummaryCard({
  avgKmPerLiter,
  bestKmPerLiter,
  worstKmPerLiter,
  costPerKm,
}: FuelSummaryCardProps) {
  return (
    <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-text-secondary">Médio</dt>
        <dd className="font-mono text-text-primary">
          {avgKmPerLiter != null ? formatConsumption(avgKmPerLiter) : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-text-secondary">Melhor</dt>
        <dd className="font-mono text-text-primary">
          {bestKmPerLiter != null ? formatConsumption(bestKmPerLiter) : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-text-secondary">Pior</dt>
        <dd className="font-mono text-text-primary">
          {worstKmPerLiter != null ? formatConsumption(worstKmPerLiter) : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-text-secondary">Custo/km</dt>
        <dd className="font-mono text-text-primary">
          {costPerKm != null ? `${formatMoney(costPerKm)}/km` : "—"}
        </dd>
      </div>
    </dl>
  );
}
