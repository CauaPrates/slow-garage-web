import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DashboardExpensesByCategory, DashboardExpensesByMonth } from "@/features/dashboard/types";

export type GarageSummary = {
  expensesByCategory: DashboardExpensesByCategory[];
  expensesByMonth: DashboardExpensesByMonth[];
};

/**
 * Não existe um `get_garage_dashboard` (RPC única, como `get_vehicle_dashboard`
 * tem por veículo) — soma no cliente a partir das views por veículo já
 * existentes (`vehicle_expenses_by_category`/`vehicle_expenses_by_month`,
 * mesmas que alimentam o dashboard de um veículo só). Somar valor real que
 * o banco já calculou por veículo não é "inventar dado" (RN geral do
 * projeto) — é diferente de recalcular uma regra de negócio; se este
 * resumo crescer em lógica, promover pra RPC própria fica mais fácil de
 * justificar (ver docs/DECISIONS.md).
 */
async function fetchGarageSummary(vehicleIds: string[]): Promise<GarageSummary> {
  if (vehicleIds.length === 0) {
    return { expensesByCategory: [], expensesByMonth: [] };
  }

  const [categoryResult, monthResult] = await Promise.all([
    supabase.from("vehicle_expenses_by_category").select("*").in("vehicle_id", vehicleIds),
    supabase.from("vehicle_expenses_by_month").select("*").in("vehicle_id", vehicleIds),
  ]);
  if (categoryResult.error) throw categoryResult.error;
  if (monthResult.error) throw monthResult.error;

  const categoryTotals = new Map<string, DashboardExpensesByCategory>();
  for (const row of categoryResult.data ?? []) {
    if (!row.category_slug || row.total_amount == null) continue;
    const existing = categoryTotals.get(row.category_slug);
    categoryTotals.set(row.category_slug, {
      vehicle_id: "all",
      category_slug: row.category_slug,
      category_label: row.category_label ?? row.category_slug,
      total_amount: (existing?.total_amount ?? 0) + row.total_amount,
      expense_count: (existing?.expense_count ?? 0) + (row.expense_count ?? 0),
    });
  }

  const monthTotals = new Map<string, DashboardExpensesByMonth>();
  for (const row of monthResult.data ?? []) {
    if (!row.month || row.total_amount == null) continue;
    const existing = monthTotals.get(row.month);
    monthTotals.set(row.month, {
      vehicle_id: "all",
      month: row.month,
      total_amount: (existing?.total_amount ?? 0) + row.total_amount,
    });
  }

  return {
    expensesByCategory: [...categoryTotals.values()],
    expensesByMonth: [...monthTotals.values()].sort((a, b) => a.month.localeCompare(b.month)),
  };
}

/** As 5 somas de `vehicle_financial_summary` já estão em cache via `useVehicles` — não precisam de query nova, só soma no chamador. Este hook cobre só o que exige dado que `useVehicles` não busca (categoria/mês agregados). */
export function useGarageSummary(vehicleIds: string[]) {
  return useQuery({
    queryKey: ["garage-summary", ...[...vehicleIds].sort()],
    queryFn: () => fetchGarageSummary(vehicleIds),
    enabled: vehicleIds.length > 0,
  });
}
