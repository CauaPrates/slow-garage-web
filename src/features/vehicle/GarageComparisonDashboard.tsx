import { useId } from "react";
import { formatMoney } from "@/lib/format";
import { VehicleInvestmentChart } from "@/features/dashboard/VehicleInvestmentChart";
import { GarageTile, GarageTileGrid } from "./GarageTiles";
import type { VehicleWithSummary } from "./useVehicles";

type GarageComparisonDashboardProps = {
  vehicles: VehicleWithSummary[];
};

/**
 * Fase 15: compara os veículos entre si em vez de repetir número do
 * `GarageSummary`. Layout de módulos separados por fio de 1px (ADR-070).
 *
 * Redesign etapa 02: os indicadores operacionais que moravam aqui (veículos,
 * gasto no mês, próxima manutenção, pendências) subiram pra faixa curta do
 * topo da garagem (`GarageOverview`) — inclusive no mobile, onde este painel
 * inteiro ficava escondido. Aqui fica o que é comparação de verdade: custo/km
 * médio (com quantos veículos têm o dado) e investimento por veículo. Mora em
 * "Detalhes da garagem", recolhido por padrão; mesmas fórmulas de antes.
 */
export function GarageComparisonDashboard({
  vehicles,
}: GarageComparisonDashboardProps) {
  const titleId = useId();

  // RN-2: veículo sem custo/km calculado não entra na média (não conta como 0).
  const costsPerKm = vehicles
    .map((v) => v.financialSummary?.cost_per_km)
    .filter((cost): cost is number => cost != null);
  const avgCostPerKm =
    costsPerKm.length > 0
      ? costsPerKm.reduce((sum, cost) => sum + cost, 0) / costsPerKm.length
      : null;

  const investmentData = vehicles.map((v) => ({
    vehicleId: v.id,
    label: `${v.make} ${v.model}`,
    totalInvested: v.financialSummary?.total_invested ?? 0,
  }));

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
    >
      <h3
        id={titleId}
        className="border-b border-border px-4 py-3 text-sm font-medium text-text-primary"
      >
        Comparativo entre veículos
      </h3>

      <GarageTileGrid className="grid-cols-1">
        <GarageTile
          label="Custo/km médio"
          value={avgCostPerKm != null ? `${formatMoney(avgCostPerKm)}/km` : "—"}
          hint={`${costsPerKm.length} de ${vehicles.length} veículos com dado`}
        />
      </GarageTileGrid>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
        <h4 className="text-xs font-medium tracking-wide text-text-secondary uppercase">
          Investimento por veículo
        </h4>
        <VehicleInvestmentChart data={investmentData} />
      </div>
    </section>
  );
}
