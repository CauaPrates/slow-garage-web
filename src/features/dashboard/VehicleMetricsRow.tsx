import { formatKm, formatMoney } from "@/lib/format";

type VehicleMetricsRowProps = {
  currentOdometerKm: number | null;
  costPerKm: number | null;
  totalInvested: number | null;
  activeAlertsCount: number;
};

/**
 * Fase 13: os 3 primeiros valores são medição direta (km/R$/km-por-km) —
 * `font-mono`, mesma regra da Fase 12. Alertas é contagem, não medição —
 * continua Space Grotesk de propósito (ver plan.md, "Alternativas descartadas").
 */
export function VehicleMetricsRow({
  currentOdometerKm,
  costPerKm,
  totalInvested,
  activeAlertsCount,
}: VehicleMetricsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs text-text-secondary">Km atual</p>
        <p className="font-mono text-lg font-medium text-text-primary">
          {currentOdometerKm != null ? formatKm(currentOdometerKm) : "—"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs text-text-secondary">Custo/km</p>
        <p className="font-mono text-lg font-medium text-text-primary">
          {costPerKm != null ? `${formatMoney(costPerKm)}/km` : "—"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs text-text-secondary">Total investido</p>
        <p className="font-mono text-lg font-medium text-text-primary">
          {totalInvested != null ? formatMoney(totalInvested) : "—"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs text-text-secondary">Alertas ativos</p>
        <p className="text-lg font-medium text-text-primary">{activeAlertsCount}</p>
      </div>
    </div>
  );
}
