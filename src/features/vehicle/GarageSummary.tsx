import { useId } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { ExpensesByCategoryChart } from "@/features/dashboard/ExpensesByCategoryChart";
import { ExpensesByMonthChart } from "@/features/dashboard/ExpensesByMonthChart";
import { useGarageSummary } from "./useGarageSummary";
import { GarageTile, GarageTileGrid } from "./GarageTiles";
import type { VehicleWithSummary } from "./useVehicles";

type GarageSummaryProps = {
  vehicles: VehicleWithSummary[];
};

function sumField(
  vehicles: VehicleWithSummary[],
  field:
    | "total_invested"
    | "total_expenses"
    | "total_maintenance"
    | "total_fuel"
    | "total_project_items",
) {
  return vehicles.reduce(
    (sum, v) => sum + (v.financialSummary?.[field] ?? 0),
    0,
  );
}

/**
 * Resumo financeiro de todos os veículos juntos (Fase 14d, ADR-051). Só
 * aparece com 2+ veículos — com 1 só, seria idêntico ao resumo daquele
 * veículo (RN geral do projeto: nunca duplicar número já visível em outro
 * lugar).
 *
 * Redesign etapa 02: deixou de ter acordeão e casca próprios — mora dentro
 * de "Detalhes da garagem" (`GarageOverview`), que já começa recolhido em
 * qualquer largura. Os 5 totais viraram módulos da grade de instrumentos
 * (ADR-070), e a soma é a mesma de antes. O que mudou é dizer quando ela não
 * cobre todo mundo: veículo sem linha na view financeira não entra como
 * zero escondido — o painel avisa quantos ficaram de fora.
 */
export function GarageSummary({ vehicles }: GarageSummaryProps) {
  const summaryQuery = useGarageSummary(vehicles.map((v) => v.id));
  const titleId = useId();
  const withSummary = vehicles.filter((v) => v.financialSummary != null).length;
  const missing = vehicles.length - withSummary;

  const totals = [
    { label: "Total investido", value: sumField(vehicles, "total_invested") },
    { label: "Gastos", value: sumField(vehicles, "total_expenses") },
    { label: "Manutenção", value: sumField(vehicles, "total_maintenance") },
    { label: "Combustível", value: sumField(vehicles, "total_fuel") },
    {
      label: "Itens de projeto",
      value: sumField(vehicles, "total_project_items"),
    },
  ];

  return (
    <>
      <section
        aria-labelledby={titleId}
        className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
      >
        <div className="flex flex-col gap-0.5 border-b border-border px-4 py-3">
          <h3
            id={titleId}
            className="text-sm font-medium text-text-primary"
          >
            Resumo financeiro
          </h3>
          <p className="text-xs text-text-secondary">
            Acumulado de {vehicles.length} veículos, desde o cadastro
            {missing > 0 &&
              ` — sem dado financeiro de ${missing} ${missing === 1 ? "veículo" : "veículos"}`}
            .
          </p>
        </div>
        <GarageTileGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {totals.map((item) => (
            <GarageTile
              key={item.label}
              label={item.label}
              value={withSummary > 0 ? formatMoney(item.value) : "—"}
            />
          ))}
        </GarageTileGrid>
      </section>

      {summaryQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden="true">
          <div className="h-48 animate-pulse rounded-lg border border-border bg-surface" />
          <div className="h-48 animate-pulse rounded-lg border border-border bg-surface" />
        </div>
      )}

      {summaryQuery.isError && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4">
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            Não foi possível carregar os gastos por mês e por categoria.
          </p>
          <Button variant="outline" onClick={() => summaryQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {summaryQuery.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ExpensesByMonthChart data={summaryQuery.data.expensesByMonth} />
          <ExpensesByCategoryChart
            data={summaryQuery.data.expensesByCategory}
          />
        </div>
      )}
    </>
  );
}
