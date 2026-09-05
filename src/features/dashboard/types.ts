import type { Database } from "@/types/database.types";

export type VehicleAlert = Database["public"]["Views"]["vehicle_alerts"]["Row"];

export type DashboardFinancialSummary = {
  vehicle_id: string;
  purchase_price: number | null;
  total_invested: number | null;
  total_expenses: number | null;
  total_maintenance: number | null;
  total_fuel: number | null;
  total_project_items: number | null;
  cost_per_km: number | null;
  current_month_spend: number | null;
  current_year_spend: number | null;
};

export type DashboardFuelSummary = {
  vehicle_id: string;
  total_liters: number | null;
  avg_km_per_liter: number | null;
  best_km_per_liter: number | null;
  worst_km_per_liter: number | null;
  avg_price_per_liter: number | null;
};

export type DashboardExpensesByMonth = {
  vehicle_id: string;
  month: string;
  total_amount: number;
};

export type DashboardExpensesByCategory = {
  vehicle_id: string;
  category_slug: string;
  category_label: string;
  total_amount: number;
  expense_count: number;
};

/**
 * `get_vehicle_dashboard` retorna `jsonb` — o gerador de tipos não tipa o
 * shape de retorno de RPC, só `Json` genérico. Este tipo espelha a forma
 * real observada consultando a RPC contra o veículo seed (`bob`/Chevrolet
 * Opala) antes de escrever a spec, não uma suposição.
 */
export type VehicleDashboard = {
  financial_summary: DashboardFinancialSummary | null;
  fuel_summary: DashboardFuelSummary | null;
  expenses_by_month: DashboardExpensesByMonth[];
  expenses_by_category: DashboardExpensesByCategory[];
  alerts: VehicleAlert[];
  open_issues_count: number;
  active_projects_count: number;
};
