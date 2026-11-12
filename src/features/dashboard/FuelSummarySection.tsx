import { formatConsumption, formatLiters, formatMoney } from "@/lib/format";
import { GarageTile, GarageTileGrid } from "@/features/vehicle/GarageTiles";
import { Panel, PanelDisclosure } from "@/components/ui/panel";
import type { DashboardFuelSummary } from "./types";

type FuelSummarySectionProps = {
  summary: DashboardFuelSummary | null;
};

const consumption = (value: number | null | undefined) => (value != null ? formatConsumption(value) : "—");

/**
 * Etapa 04: o consumo médio subiu pros indicadores; aqui ficam melhor e pior
 * (abertos) e preço médio e litros (em "Detalhes de combustível"). Tudo de
 * `vehicle_fuel_summary`, sem período: é o histórico inteiro. Consumo só
 * existe entre dois abastecimentos de tanque cheio sem abastecimento
 * esquecido no meio (`fuel_log_metrics`) — sem isso, "—" e o motivo, nunca
 * 0 km/L.
 */
export function FuelSummarySection({ summary }: FuelSummarySectionProps) {
  const noConsumption = summary != null && summary.avg_km_per_liter == null;

  return (
    <Panel
      title="Combustível"
      description={
        summary == null
          ? "Nenhum abastecimento registrado ainda."
          : noConsumption
            ? "Consumo aparece depois de dois abastecimentos de tanque cheio seguidos."
            : "Histórico completo de abastecimentos."
      }
    >
      <GarageTileGrid className="grid-cols-2">
        <GarageTile label="Melhor consumo" value={consumption(summary?.best_km_per_liter)} />
        <GarageTile label="Pior consumo" value={consumption(summary?.worst_km_per_liter)} />
      </GarageTileGrid>

      <PanelDisclosure label="Detalhes de combustível" hint="preço e litros">
        <GarageTileGrid className="grid-cols-2">
          <GarageTile
            label="Preço médio"
            value={summary?.avg_price_per_liter != null ? `${formatMoney(summary.avg_price_per_liter)}/L` : "—"}
            hint="Média por abastecimento."
            wrap
            fullHint
          />
          <GarageTile
            label="Litros no total"
            value={summary?.total_liters != null ? formatLiters(summary.total_liters) : "—"}
          />
        </GarageTileGrid>
        <p className="border-t border-border px-4 py-3 text-xs text-text-secondary">
          Consumo é calculado só entre dois abastecimentos de tanque cheio, sem abastecimento esquecido entre eles. A
          média considera todos esses trechos.
        </p>
      </PanelDisclosure>
    </Panel>
  );
}
