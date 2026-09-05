import type { ReactNode } from "react";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { VehicleInvestmentChart } from "@/features/dashboard/VehicleInvestmentChart";
import { useGarageAlerts } from "./useGarageAlerts";
import { useGarageMaintenance } from "./useGarageMaintenance";
import type { VehicleWithSummary } from "./useVehicles";

type GarageComparisonDashboardProps = {
  vehicles: VehicleWithSummary[];
};

type Tile = {
  label: string;
  value: ReactNode;
  /** Segunda linha discreta do módulo — contexto do número (de qual veículo, quantos vencidos), nunca outro número solto. */
  hint?: string;
  loading?: boolean;
};

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Fase 15: ocupa o espaço que era do card "Atividade recente" (movido pra
 * sidebar/cabeçalho na 15b) — em vez de repetir número que já aparece em
 * `GarageSummary`, compara os veículos entre si.
 *
 * Fase 15d: "Km total rodado" saiu (somar odômetro de veículos diferentes não
 * é grandeza nenhuma — são escalas independentes, não um fluxo cumulativo);
 * entraram "Próxima manutenção" e "Pendências ativas", que agregam de verdade
 * porque são "o mais urgente da frota" e "quantos pendentes", não uma soma de
 * réguas distintas. As pendências vêm de `useGarageAlerts` — a mesma fonte do
 * sino do cabeçalho, mesma query key, então o React Query serve do cache em
 * vez de refazer a leitura (nem duplica regra de alerta em dois lugares).
 * Layout de módulos separados por fio de 1px (ver ADR-070).
 */
export function GarageComparisonDashboard({
  vehicles,
}: GarageComparisonDashboardProps) {
  const vehicleIds = vehicles.map((v) => v.id);
  const alertsQuery = useGarageAlerts(vehicleIds);
  const maintenanceQuery = useGarageMaintenance(vehicleIds);

  const activeCount = vehicles.filter((v) => v.status === "active").length;

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

  const vehicleLabelById = new Map(
    vehicles.map((v) => [v.id, `${v.make} ${v.model}`]),
  );
  const nextService = maintenanceQuery.data?.[0] ?? null;

  const alerts = alertsQuery.data ?? [];
  const overdueCount = alerts.filter((a) => a.severity === "critical").length;

  const tiles: Tile[] = [
    {
      label: "Veículos na garagem",
      value: vehicles.length,
      hint: plural(activeCount, "ativo", "ativos"),
    },
    {
      label: "Custo/km médio",
      value: avgCostPerKm != null ? `${formatMoney(avgCostPerKm)}/km` : "—",
      hint:
        costsPerKm.length < vehicles.length
          ? `${costsPerKm.length} de ${vehicles.length} com dado`
          : undefined,
    },
    { label: "Gasto no mês", value: formatMoney(monthSpend) },
    {
      label: "Próxima manutenção",
      value: nextService?.name ?? "—",
      hint: nextService
        ? [
            vehicleLabelById.get(nextService.vehicle_id),
            formatDateOnly(nextService.next_service_date),
          ]
            .filter(Boolean)
            .join(" · ")
        : maintenanceQuery.isLoading
          ? undefined
          : "nenhuma prevista",
      loading: maintenanceQuery.isLoading,
    },
    {
      label: "Pendências ativas",
      value: alertsQuery.isError ? "—" : alerts.length,
      hint: alertsQuery.isLoading
        ? undefined
        : alerts.length === 0
          ? "nada vencendo"
          : overdueCount > 0
            ? plural(overdueCount, "vencida", "vencidas")
            : "nenhuma vencida",
      loading: alertsQuery.isLoading,
    },
  ];

  const investmentData = vehicles.map((v) => ({
    vehicleId: v.id,
    label: `${v.make} ${v.model}`,
    totalInvested: v.financialSummary?.total_invested ?? 0,
  }));

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <h2 className="border-b border-border px-4 py-3 text-sm font-medium text-text-primary">
        Comparativo da garagem
      </h2>

      {/*
        Grade de instrumentos: fio de 1px entre módulos em vez de card dentro
        de card. `-mt-px -ml-px` + `border-t border-l` em cada módulo desenha
        cada linha interna uma vez só e joga as externas pra debaixo da borda
        do painel (`overflow-hidden` acima) — funciona em qualquer contagem de
        coluna, sem célula vazia sobrando em nenhum breakpoint.
      */}
      <dl className="-mt-px -ml-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex flex-col gap-1 border-t border-l border-border px-4 py-3"
          >
            <dt className="text-xs text-text-secondary">{tile.label}</dt>
            <dd className="min-w-0">
              {tile.loading ? (
                <span
                  className="block h-5 w-20 animate-pulse rounded bg-bg"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="block truncate font-mono text-text-primary"
                  title={
                    typeof tile.value === "string" ? tile.value : undefined
                  }
                >
                  {tile.value}
                </span>
              )}
              {tile.hint && (
                <span
                  className="block truncate text-xs text-text-secondary"
                  title={tile.hint}
                >
                  {tile.hint}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
        <h3 className="text-xs font-medium tracking-wide text-text-secondary uppercase">
          Investimento por veículo
        </h3>
        <VehicleInvestmentChart data={investmentData} />
      </div>
    </div>
  );
}
