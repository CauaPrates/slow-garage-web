import { formatMoney } from "@/lib/format";
import { ExpensesByCategoryChart } from "@/features/dashboard/ExpensesByCategoryChart";
import { ExpensesByMonthChart } from "@/features/dashboard/ExpensesByMonthChart";
import { useGarageSummary } from "./useGarageSummary";
import type { VehicleWithSummary } from "./useVehicles";

type GarageSummaryProps = {
  vehicles: VehicleWithSummary[];
};

function sumField(vehicles: VehicleWithSummary[], field: "total_invested" | "total_expenses" | "total_maintenance" | "total_fuel" | "total_project_items") {
  return vehicles.reduce((sum, v) => sum + (v.financialSummary?.[field] ?? 0), 0);
}

/** Só aparece com 2+ veículos — com 1 só, seria idêntico ao resumo daquele veículo (RN geral do projeto: nunca duplicar número já visível em outro lugar). */
export function GarageSummary({ vehicles }: GarageSummaryProps) {
  const summaryQuery = useGarageSummary(vehicles.map((v) => v.id));

  const totals = [
    { label: "Total investido", value: sumField(vehicles, "total_invested") },
    { label: "Gastos", value: sumField(vehicles, "total_expenses") },
    { label: "Manutenção", value: sumField(vehicles, "total_maintenance") },
    { label: "Combustível", value: sumField(vehicles, "total_fuel") },
    { label: "Itens de projeto", value: sumField(vehicles, "total_project_items") },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-medium text-text-primary">
        Resumo de todos os veículos ({vehicles.length})
      </h2>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
        {totals.map((item) => (
          <div key={item.label}>
            <dt className="text-text-secondary">{item.label}</dt>
            <dd className="font-mono text-text-primary">{formatMoney(item.value)}</dd>
          </div>
        ))}
      </dl>

      {summaryQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-lg border border-border bg-bg" />
          <div className="h-40 animate-pulse rounded-lg border border-border bg-bg" />
        </div>
      )}

      {summaryQuery.isError && (
        <p className="text-sm text-text-secondary">Não foi possível carregar o resumo por categoria/mês.</p>
      )}

      {summaryQuery.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ExpensesByMonthChart data={summaryQuery.data.expensesByMonth} />
          <ExpensesByCategoryChart data={summaryQuery.data.expensesByCategory} />
        </div>
      )}
    </div>
  );
}
