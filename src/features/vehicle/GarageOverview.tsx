import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGarageAlerts } from "./useGarageAlerts";
import { useGarageMaintenance } from "./useGarageMaintenance";
import { GarageComparisonDashboard } from "./GarageComparisonDashboard";
import { GarageSummary } from "./GarageSummary";
import { GarageTile, GarageTileGrid, type GarageTileState } from "./GarageTiles";
import type { VehicleWithSummary } from "./useVehicles";

type GarageOverviewProps = {
  vehicles: VehicleWithSummary[];
};

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function queryState(query: {
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
}): GarageTileState {
  if (query.isLoading) return { status: "loading" };
  if (query.isError) return { status: "error", onRetry: () => void query.refetch() };
  return { status: "ready" };
}

/**
 * Redesign etapa 02: resumo operacional curto no topo da garagem, antes da
 * grade de veículos, e o detalhamento atrás de um gatilho claro.
 *
 * - Com 2+ veículos: veículos, gasto no mês atual (soma de
 *   `current_month_spend`, mês corrente da view) e pendências — no celular os
 *   três numa linha só, pra o primeiro carro aparecer na primeira tela. A
 *   próxima manutenção entra na faixa a partir de `lg`; abaixo disso fica no
 *   topo dos detalhes, com o veículo e a data por extenso. "Detalhes da garagem" abre o `GarageSummary` (totais e
 *   gráficos) e o `GarageComparisonDashboard` (custo/km médio e investimento
 *   por veículo), recolhido por padrão em qualquer largura — os detalhes
 *   nunca empurram os veículos pra fora da primeira tela sem o usuário pedir.
 * - Com 1 veículo: só pendências e próxima manutenção. Contagem, gasto do mês,
 *   custo/km e total investido já estão no próprio card — repetir aqui seria
 *   o "resumo da garagem" que só espelha um veículo (ADR-051).
 *
 * Pendências e manutenção têm estado próprio: erro de uma consulta nunca vira
 * "nenhuma pendência" nem derruba a outra. As pendências vêm de
 * `useGarageAlerts`, a mesma fonte (e a mesma query key) do sino do
 * cabeçalho.
 */
export function GarageOverview({ vehicles }: GarageOverviewProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const titleId = useId();
  const detailsId = useId();
  const vehicleIds = vehicles.map((v) => v.id);
  const alertsQuery = useGarageAlerts(vehicleIds);
  const maintenanceQuery = useGarageMaintenance(vehicleIds);
  const isGarage = vehicles.length >= 2;

  const vehicleLabelById = new Map(
    vehicles.map((v) => [v.id, `${v.make} ${v.model}`]),
  );

  const activeCount = vehicles.filter((v) => v.status === "active").length;

  const withSummary = vehicles.filter((v) => v.financialSummary != null);
  const monthSpend = vehicles.reduce(
    (sum, v) => sum + (v.financialSummary?.current_month_spend ?? 0),
    0,
  );
  const missingSummary = vehicles.length - withSummary.length;

  const alerts = alertsQuery.data ?? [];
  const overdueCount = alerts.filter((a) => a.severity === "critical").length;
  const alertVehicleIds = [...new Set(alerts.map((a) => a.vehicle_id))];
  const alertsHint =
    alerts.length === 0
      ? "nada vencendo"
      : overdueCount > 0
        ? plural(overdueCount, "vencida", "vencidas")
        : "nenhuma vencida";
  // Identifica o veículo quando a contagem depende dele (a partir de `sm`; no celular o módulo é estreito e o sino lista por veículo).
  const alertsHintDetail = !isGarage
    ? undefined
    : alertVehicleIds.length === 1
      ? vehicleLabelById.get(alertVehicleIds[0])
      : alertVehicleIds.length > 1
        ? `em ${alertVehicleIds.length} veículos`
        : undefined;

  const nextService = maintenanceQuery.data?.[0] ?? null;
  const nextServiceHint = nextService
    ? [
        isGarage ? vehicleLabelById.get(nextService.vehicle_id) : null,
        formatDateOnly(nextService.next_service_date),
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  const nextServiceTile = (props: { className?: string; fullHint?: boolean }) => (
    <GarageTile
      label="Próxima manutenção"
      value={nextService?.name ?? "Nenhuma prevista"}
      hint={nextServiceHint}
      state={queryState(maintenanceQuery)}
      wrap
      mono={false}
      {...props}
    />
  );

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <h2 id={titleId} className="sr-only">
          Resumo da garagem
        </h2>
        <GarageTileGrid
          className={
            isGarage
              ? // Celular: 3 módulos numa linha, com mais largura pro valor em reais.
                "grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] sm:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-2"
          }
        >
          {isGarage && (
            <>
              <GarageTile
                label="Veículos"
                value={vehicles.length}
                hint={plural(activeCount, "ativo", "ativos")}
              />
              <GarageTile
                label="Gasto no mês"
                value={withSummary.length > 0 ? formatMoney(monthSpend) : "—"}
                hint={
                  missingSummary > 0
                    ? `sem dado de ${plural(missingSummary, "veículo", "veículos")}`
                    : "mês atual"
                }
              />
            </>
          )}
          <GarageTile
            label="Pendências"
            value={alerts.length}
            hint={alertsHint}
            hintDetail={alertsHintDetail}
            state={queryState(alertsQuery)}
            wrap
          />
          {/* Com 2+ veículos, abaixo de `lg` a próxima manutenção mora nos detalhes (o nome do veículo não cabe na faixa curta). */}
          {nextServiceTile({ className: isGarage ? "hidden lg:flex" : undefined })}
        </GarageTileGrid>

        {isGarage && (
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            className="flex min-h-11 items-center justify-between gap-2 border-t border-border px-4 text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
          >
            <span>
              Detalhes da garagem
              <span className="hidden font-normal text-text-secondary sm:inline lg:hidden">
                {" "}
                — próxima manutenção, totais e gráficos
              </span>
              <span className="hidden font-normal text-text-secondary lg:inline">
                {" "}
                — totais, gráficos e comparativo
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-150",
                detailsOpen && "rotate-180",
              )}
            />
          </button>
        )}
      </div>

      {isGarage && (
        <div
          id={detailsId}
          hidden={!detailsOpen}
          className="flex flex-col gap-4"
        >
          {detailsOpen && (
            <>
              <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface lg:hidden">
                <GarageTileGrid className="grid-cols-1">
                  {nextServiceTile({ fullHint: true })}
                </GarageTileGrid>
              </div>
              <GarageSummary vehicles={vehicles} />
              <GarageComparisonDashboard vehicles={vehicles} />
            </>
          )}
        </div>
      )}
    </section>
  );
}
