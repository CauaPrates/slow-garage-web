import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatConsumption, formatMoney } from "@/lib/format";
import { GarageTile, GarageTileGrid } from "@/features/vehicle/GarageTiles";
import type { DashboardFinancialSummary, DashboardFuelSummary } from "./types";

type VehicleMetricsRowProps =
  | { status: "loading" }
  | { status: "error"; onRetry: () => void }
  | {
      status: "ready";
      financial: DashboardFinancialSummary | null;
      fuel: DashboardFuelSummary | null;
    };

/*
  Etapa 05: sob o número fica só o contexto curto (período e fonte); a regra
  inteira vai pra ajuda do módulo ("i", abre por clique/toque/teclado). Quando
  o valor é "—", o motivo continua escrito sob ele — é o que explica o traço.
*/
function consumptionHint(fuel: DashboardFuelSummary | null): string {
  if (fuel == null) return "Nenhum abastecimento registrado.";
  if (fuel.avg_km_per_liter == null) return "Precisa de dois tanques cheios seguidos.";
  return "Histórico · tanques cheios";
}

function costPerKmHint(financial: DashboardFinancialSummary | null): string {
  if (financial == null) return "Sem dado financeiro.";
  if (financial.cost_per_km == null) return "Sem quilometragem registrada.";
  return "Investimento ÷ odômetro";
}

const MONTH_SPEND_HELP =
  "Soma do mês do calendário atual: gastos, combustível, manutenção e itens de projeto instalados. A compra do veículo não entra.";
const CONSUMPTION_HELP =
  "Média de todos os trechos entre dois tanques cheios seguidos, no histórico inteiro. Trecho com abastecimento esquecido no meio não entra.";
const COST_PER_KM_HELP =
  "Total investido (compra + todos os registros) dividido pelo odômetro atual. Vale pro histórico inteiro, não é custo do mês.";

/**
 * Etapa 04: os três indicadores do topo, cada um com o período que a fonte
 * define de verdade (ver `vehicle_financial_summary`/`vehicle_fuel_summary`):
 * gasto no mês é o mês do calendário com as 4 fontes; consumo é a média de
 * todos os trechos de tanque cheio; custo/km é o total investido (com a
 * compra) dividido pelo odômetro — vitalício, não mensal. Ausente vira "—"
 * com o motivo, nunca zero. O odômetro saiu daqui (está no cabeçalho, em
 * texto) e o arco decorativo saiu de vez. O realce de valor alterado
 * (`flashOnChange`) continua: pisca quando um registro novo muda o número,
 * nunca na primeira carga nem na troca de veículo.
 */
export function VehicleMetricsRow(props: VehicleMetricsRowProps) {
  if (props.status === "error") {
    return (
      <section
        aria-labelledby="metrics-title"
        className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4"
      >
        <h2 id="metrics-title" className="sr-only">
          Indicadores
        </h2>
        <p className="flex items-center gap-2 text-sm text-text-secondary">
          <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
          Não foi possível carregar indicadores, pendências e resumos deste veículo.
        </p>
        <Button variant="outline" onClick={props.onRetry}>
          Tentar de novo
        </Button>
      </section>
    );
  }

  const loading = props.status === "loading";
  const financial = loading ? null : props.financial;
  const fuel = loading ? null : props.fuel;
  const state = loading ? ({ status: "loading" } as const) : undefined;
  const monthSpend = financial?.current_month_spend;
  const costPerKm = financial?.cost_per_km;
  const avg = fuel?.avg_km_per_liter;

  return (
    <section aria-labelledby="metrics-title" className="overflow-hidden rounded-lg border border-border bg-surface">
      <h2 id="metrics-title" className="sr-only">
        Indicadores
      </h2>
      <GarageTileGrid className="grid-cols-2 sm:grid-cols-3">
        <GarageTile
          className="col-span-2 sm:col-span-1"
          label="Gasto no mês"
          size="lg"
          flashOnChange
          state={state}
          value={monthSpend != null ? formatMoney(monthSpend) : "—"}
          hint={financial ? "Mês atual · 4 fontes" : "Sem dado financeiro."}
          help={MONTH_SPEND_HELP}
          wrap
          fullHint
        />
        <GarageTile
          label="Consumo médio"
          size="lg"
          flashOnChange
          state={state}
          value={avg != null ? formatConsumption(avg) : "—"}
          hint={consumptionHint(fuel)}
          help={CONSUMPTION_HELP}
          wrap
          fullHint
        />
        <GarageTile
          label="Custo por km"
          size="lg"
          flashOnChange
          state={state}
          value={costPerKm != null ? `${formatMoney(costPerKm)}/km` : "—"}
          hint={costPerKmHint(financial)}
          help={COST_PER_KM_HELP}
          wrap
          fullHint
        />
      </GarageTileGrid>
    </section>
  );
}
