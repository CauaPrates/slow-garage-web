import { formatMoney } from "@/lib/format";

type VehicleInvestmentDatum = {
  vehicleId: string;
  label: string;
  totalInvested: number;
};

type VehicleInvestmentChartProps = {
  data: VehicleInvestmentDatum[];
};

const SERIES_COUNT = 8;

/**
 * Fase 15: comparativo de investimento entre veículos da garagem — mesmo
 * padrão visual do `ExpensesByCategoryChart` (barra horizontal, paleta
 * categórica de 8 slots, resto agrupado em "Outros"), porque aqui cada
 * barra também é uma identidade (o veículo), não uma magnitude ao longo
 * do tempo.
 */
export function VehicleInvestmentChart({ data }: VehicleInvestmentChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-medium text-text-primary">
          Investimento por veículo
        </h3>
        <p className="text-sm text-text-secondary">
          Nenhum veículo com gasto registrado ainda.
        </p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.totalInvested - a.totalInvested);
  const visible = sorted.slice(0, SERIES_COUNT);
  const rest = sorted.slice(SERIES_COUNT);
  const rows =
    rest.length > 0
      ? [
          ...visible,
          {
            vehicleId: "other",
            label: "Outros",
            totalInvested: rest.reduce((sum, r) => sum + r.totalInvested, 0),
          },
        ]
      : visible;

  const maxAmount = Math.max(...rows.map((r) => r.totalInvested));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-medium text-text-primary">
        Investimento por veículo
      </h3>
      <div className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const widthPct =
            maxAmount > 0 ? (row.totalInvested / maxAmount) * 100 : 0;
          const color =
            row.vehicleId === "other"
              ? "var(--color-text-secondary)"
              : `var(--chart-series-${(index % SERIES_COUNT) + 1})`;
          return (
            <div key={row.vehicleId} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 truncate text-text-primary">
                  {row.label}
                </span>
                <span className="shrink-0 text-text-secondary">
                  {formatMoney(row.totalInvested)}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-bg">
                <div
                  className="h-3 rounded-full"
                  style={{
                    width: `${Math.max(widthPct, 3)}%`,
                    backgroundColor: color,
                  }}
                  title={`${row.label}: ${formatMoney(row.totalInvested)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
