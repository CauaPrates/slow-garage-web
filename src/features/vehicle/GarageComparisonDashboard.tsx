import { formatKm, formatMoney } from "@/lib/format";
import { VehicleInvestmentChart } from "@/features/dashboard/VehicleInvestmentChart";
import type { VehicleWithSummary } from "./useVehicles";

type GarageComparisonDashboardProps = {
  vehicles: VehicleWithSummary[];
};

/**
 * Fase 15: ocupa o espaço que era do card "Atividade recente" (movido pro
 * cabeçalho, `HeaderActivityMenu`) — em vez de repetir número que já
 * aparece em `GarageSummary` (total investido, gastos por categoria/mês),
 * este painel compara os veículos entre si. Só aparece com 2+ veículos
 * (RN-1, mesma regra do `GarageSummary`: com 1 só, o número seria
 * idêntico ao daquele veículo). Tudo calculado no cliente a partir do
 * array já carregado por `useVehicles` — sem query nova.
 */
export function GarageComparisonDashboard({
  vehicles,
}: GarageComparisonDashboardProps) {
  const activeCount = vehicles.filter((v) => v.status === "active").length;

  const odometers = vehicles
    .map((v) => v.current_odometer_km)
    .filter((km): km is number => km != null);
  const totalKm = odometers.reduce((sum, km) => sum + km, 0);

  // RN-2: veículo sem custo/km calculado não entra na média (não conta como 0).
  const costsPerKm = vehicles
    .map((v) => v.financialSummary?.cost_per_km)
    .filter((cost): cost is number => cost != null);
  const avgCostPerKm =
    costsPerKm.length > 0
      ? costsPerKm.reduce((sum, cost) => sum + cost, 0) / costsPerKm.length
      : null;

  const monthSpend = vehicles.reduce(
    (sum, v) => sum + (v.financialSummary?.current_month_spend ?? 0),
    0,
  );

  const tiles = [
    {
      label: "Veículos na garagem",
      value: `${vehicles.length} (${activeCount} ativos)`,
    },
    {
      label: "Km total rodado",
      value: odometers.length > 0 ? formatKm(totalKm) : "—",
    },
    {
      label: "Custo/km médio",
      value: avgCostPerKm != null ? `${formatMoney(avgCostPerKm)}/km` : "—",
    },
    { label: "Gasto no mês", value: formatMoney(monthSpend) },
  ];

  const investmentData = vehicles.map((v) => ({
    vehicleId: v.id,
    label: `${v.make} ${v.model}`,
    totalInvested: v.financialSummary?.total_invested ?? 0,
  }));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-medium text-text-primary">
        Comparativo da garagem
      </h2>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <dt className="text-text-secondary">{tile.label}</dt>
            <dd className="font-mono text-text-primary">{tile.value}</dd>
          </div>
        ))}
      </dl>

      <VehicleInvestmentChart data={investmentData} />
    </div>
  );
}
