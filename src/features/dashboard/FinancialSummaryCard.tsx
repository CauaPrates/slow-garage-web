import { formatMoney } from "@/lib/format";
import { GarageTile, GarageTileGrid } from "@/features/vehicle/GarageTiles";
import { Panel, PanelDisclosure } from "@/components/ui/panel";
import type { DashboardFinancialSummary } from "./types";

type FinancialSummaryCardProps = {
  summary: DashboardFinancialSummary | null;
};

const money = (value: number | null | undefined) => (value != null ? formatMoney(value) : "—");

/**
 * RN-2: `null` em qualquer campo vira "—", nunca `0` inventado.
 *
 * Etapa 04: o gasto no mês e o custo/km estão nos indicadores do topo e não
 * se repetem aqui. Abertos ficam o gasto do ano e o total investido; a
 * composição do total vai pra "Detalhes financeiros". A composição descrita
 * é a da view (`vehicle_financial_summary`, migrations do backend): total =
 * compra (nula conta 0) + gastos + combustível + manutenção + itens de
 * projeto instalados; mês e ano somam só as quatro fontes de registro. Nada
 * é recalculado aqui — só exibido.
 */
export function FinancialSummaryCard({ summary }: FinancialSummaryCardProps) {
  return (
    <Panel
      title="Financeiro"
      description={summary ? undefined : "Sem dado financeiro para este veículo."}
    >
      <GarageTileGrid className="grid-cols-2">
        <GarageTile label="Gasto no ano" value={money(summary?.current_year_spend)} hint="Ano corrente, sem a compra." wrap fullHint />
        <GarageTile label="Total investido" value={money(summary?.total_invested)} flashOnChange hint="Compra + todos os registros." wrap fullHint />
      </GarageTileGrid>

      <PanelDisclosure label="Detalhes financeiros" hint="composição do total">
        <GarageTileGrid className="grid-cols-2 sm:grid-cols-3">
          <GarageTile
            label="Compra"
            value={money(summary?.purchase_price)}
            hint={summary && summary.purchase_price == null ? "Não informada; conta R$ 0,00 no total." : undefined}
            wrap
            fullHint
          />
          <GarageTile label="Gastos" value={money(summary?.total_expenses)} />
          <GarageTile label="Combustível" value={money(summary?.total_fuel)} />
          <GarageTile label="Manutenção" value={money(summary?.total_maintenance)} />
          <GarageTile label="Itens de projeto" value={money(summary?.total_project_items)} hint="Só os instalados." />
        </GarageTileGrid>
        <p className="border-t border-border px-4 py-3 text-xs text-text-secondary">
          O total investido soma estes cinco valores, de todo o histórico. Gasto no mês e no ano somam gastos,
          combustível, manutenção e itens de projeto do período, sem a compra.
        </p>
      </PanelDisclosure>
    </Panel>
  );
}
