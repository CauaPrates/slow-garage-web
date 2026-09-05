import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ExpensesByCategoryChart } from "@/features/dashboard/ExpensesByCategoryChart";
import { ExpensesByMonthChart } from "@/features/dashboard/ExpensesByMonthChart";
import { useGarageSummary } from "./useGarageSummary";
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
 * Só aparece com 2+ veículos — com 1 só, seria idêntico ao resumo daquele
 * veículo (RN geral do projeto: nunca duplicar número já visível em outro
 * lugar).
 *
 * Fase 15f: no mobile vira acordeão fechado por padrão — 5 totais + 2
 * gráficos empilhados custam mais de uma tela inteira antes de o usuário
 * chegar na lista de veículos, que é o assunto da página. A partir de `lg`
 * continua aberto e sem gatilho: lá o espaço horizontal já acomoda tudo e
 * um controle que não controla nada seria ruído. Por isso são dois títulos
 * (`h2 > button` no mobile, `h2` puro no desktop) em vez de um botão que
 * vira decorativo acima do breakpoint — botão com `aria-expanded` que não
 * expande nada é mentira pro leitor de tela.
 */
export function GarageSummary({ vehicles }: GarageSummaryProps) {
  const summaryQuery = useGarageSummary(vehicles.map((v) => v.id));
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const title = `Resumo de todos os veículos (${vehicles.length})`;

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
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm font-medium text-text-primary"
        >
          {title}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-150",
              open && "rotate-180",
            )}
          />
        </button>
      </h2>
      <h2 className="hidden text-sm font-medium text-text-primary lg:block">
        {title}
      </h2>

      <div
        id={bodyId}
        className={cn("flex-col gap-4", open ? "flex" : "hidden lg:flex")}
      >
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
          {totals.map((item) => (
            <div key={item.label}>
              <dt className="text-text-secondary">{item.label}</dt>
              <dd className="font-mono text-text-primary">
                {formatMoney(item.value)}
              </dd>
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
          <p className="text-sm text-text-secondary">
            Não foi possível carregar o resumo por categoria/mês.
          </p>
        )}

        {summaryQuery.data && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ExpensesByMonthChart data={summaryQuery.data.expensesByMonth} />
            <ExpensesByCategoryChart
              data={summaryQuery.data.expensesByCategory}
            />
          </div>
        )}
      </div>
    </div>
  );
}
