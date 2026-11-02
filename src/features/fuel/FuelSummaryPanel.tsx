import { DashboardPanel, PanelDisclosure } from "@/features/dashboard/DashboardPanel";
import { GarageTile, GarageTileGrid, type GarageTileState } from "@/features/vehicle/GarageTiles";
import { formatConsumption, formatLiters, formatMoney, formatPricePerLiter } from "@/lib/format";
import type { Database } from "@/types/database.types";

type FuelSummary = Database["public"]["Views"]["vehicle_fuel_summary"]["Row"];
type FinancialSummary = Database["public"]["Views"]["vehicle_financial_summary"]["Row"];

type FuelSummaryPanelProps = {
  /** `vehicle_fuel_summary`: carregando, erro (com tentar de novo) ou pronto. `null` pronto = sem linha na view. */
  summary: { status: "loading" } | { status: "error"; onRetry: () => void } | { status: "ready"; data: FuelSummary | null };
  /** `vehicle_financial_summary` que já vem com o veículo (`useVehicle`) — total em combustível e custo/km do veículo. */
  financial: FinancialSummary | null;
};

const consumption = (value: number | null | undefined) => (value != null ? formatConsumption(value) : "—");

const CONSUMPTION_HELP =
  "Média de todos os trechos entre dois abastecimentos de tanque cheio seguidos, com quilometragem, no histórico inteiro. Um trecho fica de fora quando um dos dois tanques foi parcial, quando falta a quilometragem ou quando um abastecimento no meio não foi registrado.";
const PRICE_HELP =
  "Média simples do preço por litro de cada abastecimento, no histórico inteiro. Não pondera pelos litros de cada parada.";
const TOTAL_HELP =
  "Soma do valor de todos os abastecimentos registrados neste veículo. Também entra no total investido e no gasto do mês do dashboard.";

/**
 * Etapa 06: o resumo de combustível da tela Abastecimentos. Tudo pronto do
 * banco — `vehicle_fuel_summary` (consumo médio/melhor/pior, preço médio por
 * litro, litros) e `vehicle_financial_summary` (total em combustível e custo
 * por km do veículo), sem soma no cliente. Período: o histórico inteiro, como
 * as views definem; nada aqui é mensal.
 *
 * Abertos: consumo médio, preço médio, litros e total. Em "Detalhes": melhor
 * e pior trecho e o custo por km **do veículo** (total investido ÷ odômetro —
 * antes aparecia só como "Custo/km", como se fosse de combustível).
 *
 * Sem base, "—" e o motivo; nunca 0 km/L. Erro de consulta mostra que não
 * carregou e oferece tentar de novo — nunca parece "sem abastecimento".
 */
export function FuelSummaryPanel({ summary, financial }: FuelSummaryPanelProps) {
  const state: GarageTileState | undefined =
    summary.status === "ready" ? undefined : summary.status === "loading" ? { status: "loading" } : summary;
  const data = summary.status === "ready" ? summary.data : null;
  const noConsumption = summary.status === "ready" && data?.avg_km_per_liter == null;

  return (
    <DashboardPanel
      title="Resumo"
      description={
        summary.status === "error"
          ? "O resumo não carregou. O histórico abaixo é independente."
          : "Histórico completo de abastecimentos deste veículo."
      }
    >
      {/* Quatro valores grandes numa linha só a partir de `xl`; abaixo, 2×2 (em 640–1279px o valor quebrava no meio). */}
      <GarageTileGrid className="grid-cols-2 xl:grid-cols-4">
        <GarageTile
          label="Consumo médio"
          size="lg"
          state={state}
          value={consumption(data?.avg_km_per_liter)}
          hint={noConsumption ? "Precisa de dois tanques cheios seguidos, com km." : "Histórico · trechos de tanque cheio"}
          help={CONSUMPTION_HELP}
          wrap
          fullHint
        />
        <GarageTile
          label="Preço médio"
          size="lg"
          state={state}
          value={data?.avg_price_per_liter != null ? formatPricePerLiter(data.avg_price_per_liter) : "—"}
          hint="Por litro · média por abastecimento"
          help={PRICE_HELP}
          wrap
          fullHint
        />
        <GarageTile
          label="Litros"
          size="lg"
          state={state}
          value={data?.total_liters != null ? formatLiters(data.total_liters) : "—"}
          hint="Soma do histórico"
          wrap
          fullHint
        />
        <GarageTile
          label="Total em combustível"
          size="lg"
          value={financial?.total_fuel != null ? formatMoney(financial.total_fuel) : "—"}
          hint={financial ? "Soma do histórico" : "Sem dado financeiro."}
          help={TOTAL_HELP}
          wrap
          fullHint
        />
      </GarageTileGrid>

      <PanelDisclosure label="Detalhes" hint="melhor e pior trecho, custo por km">
        <GarageTileGrid className="grid-cols-2 sm:grid-cols-3">
          <GarageTile
            label="Melhor trecho"
            state={state}
            value={consumption(data?.best_km_per_liter)}
            hint={noConsumption ? "Sem trecho calculado." : "Maior km/L"}
          />
          <GarageTile
            label="Pior trecho"
            state={state}
            value={consumption(data?.worst_km_per_liter)}
            hint={noConsumption ? "Sem trecho calculado." : "Menor km/L"}
          />
          <GarageTile
            className="col-span-2 sm:col-span-1"
            label="Custo por km do veículo"
            value={financial?.cost_per_km != null ? `${formatMoney(financial.cost_per_km)}/km` : "—"}
            hint={
              financial == null
                ? "Sem dado financeiro."
                : financial.cost_per_km == null
                  ? "Sem quilometragem no veículo."
                  : "Total investido ÷ odômetro, não só combustível"
            }
            wrap
            fullHint
          />
        </GarageTileGrid>
        <p className="border-t border-border px-4 py-3 text-xs text-text-secondary">
          O consumo de um trecho só é calculado entre dois abastecimentos de tanque cheio seguidos, ambos com
          quilometragem, sem abastecimento esquecido entre eles. Por isso um registro novo nem sempre mostra
          consumo na hora: o primeiro tanque cheio abre o trecho, o seguinte fecha.
        </p>
      </PanelDisclosure>
    </DashboardPanel>
  );
}
