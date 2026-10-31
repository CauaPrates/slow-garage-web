import { AlertCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useMaintenanceItems } from "@/features/maintenance/useMaintenanceItems";
import { ExpensesByCategoryChart } from "@/features/dashboard/ExpensesByCategoryChart";
import { ExpensesByMonthChart } from "@/features/dashboard/ExpensesByMonthChart";
import { FinancialSummaryCard } from "@/features/dashboard/FinancialSummaryCard";
import { FuelSummarySection } from "@/features/dashboard/FuelSummarySection";
import { PendingAlertsPanel } from "@/features/dashboard/PendingAlertsPanel";
import { QuickActionsRow } from "@/features/dashboard/QuickActionsRow";
import { RecentActivityPanel } from "@/features/dashboard/RecentActivityPanel";
import { VehicleDashboardHeader } from "@/features/dashboard/VehicleDashboardHeader";
import { VehicleMetricsRow } from "@/features/dashboard/VehicleMetricsRow";
import { useVehicleDashboard } from "@/features/dashboard/useVehicleDashboard";
import { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { useTimeline } from "@/features/timeline/useTimeline";
import { VehicleFipeCard } from "./VehicleFipeCard";
import { useVehicle, type VehicleWithSummary } from "./useVehicles";

const PAGE_CLASSNAME = "flex flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6";

export function VehiclePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { vehicle, isLoading, isError, refetch } = useVehicle(vehicleId ?? "");

  if (isLoading) {
    return (
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando veículo…</span>
        <div className="h-28 animate-pulse rounded-lg border border-border bg-surface sm:h-36" />
        <div className="h-14 animate-pulse rounded-lg border border-border bg-surface sm:h-11" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">
          Não foi possível carregar este veículo.
        </p>
        <Button variant="ghost" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-text-primary">Veículo não encontrado.</p>
        <Link to={ROUTES.home} className="text-sm text-accent underline">
          Voltar para a garagem
        </Link>
      </div>
    );
  }

  // `key`: ao trocar de veículo pelo seletor do cabeçalho a rota é a mesma, então
  // sem isso expansões abertas e diálogos do veículo anterior continuariam montados.
  return <VehicleDashboard key={vehicle.id} vehicle={vehicle} />;
}

/**
 * Etapa 04: identificação compacta → ações → indicadores → pendências e
 * atividade → financeiro e combustível → gráficos → FIPE. Cada bloco carrega
 * e falha sozinho; o RPC do painel continua sendo uma chamada só (RN-1), e
 * as consultas são as mesmas de antes, todas por `vehicleId` — dado de um
 * veículo nunca aparece no outro durante a troca.
 */
function VehicleDashboard({ vehicle }: { vehicle: VehicleWithSummary }) {
  const dashboardQuery = useVehicleDashboard(vehicle.id);
  const { data: categories } = useExpenseCategories();
  const { data: maintenanceItems } = useMaintenanceItems(vehicle.id);
  const timelineQuery = useTimeline(vehicle.id);

  const dashboard = dashboardQuery.data;
  const retryDashboard = () => void dashboardQuery.refetch();

  return (
    <div className={PAGE_CLASSNAME}>
      <Breadcrumb items={[{ label: "Dashboard" }]} showVehicle={false} />

      <VehicleDashboardHeader vehicle={vehicle} />

      <QuickActionsRow
        vehicleId={vehicle.id}
        categories={categories ?? []}
        defaultFuelType={vehicle.fuel_type}
        maintenanceItems={maintenanceItems ?? []}
      />

      <VehicleMetricsRow
        {...(dashboard
          ? { status: "ready" as const, financial: dashboard.financial_summary, fuel: dashboard.fuel_summary }
          : dashboardQuery.isError
            ? { status: "error" as const, onRetry: retryDashboard }
            : { status: "loading" as const })}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PendingAlertsPanel
          vehicleId={vehicle.id}
          currentOdometerKm={vehicle.current_odometer_km}
          query={
            dashboard
              ? {
                  status: "ready",
                  alerts: dashboard.alerts,
                  openIssuesCount: dashboard.open_issues_count,
                  activeProjectsCount: dashboard.active_projects_count,
                }
              : dashboardQuery.isError
                ? { status: "error", onRetry: retryDashboard }
                : { status: "loading" }
          }
        />
        <RecentActivityPanel
          vehicleId={vehicle.id}
          query={
            timelineQuery.data
              ? { status: "ready", events: timelineQuery.data }
              : timelineQuery.isError
                ? { status: "error", onRetry: () => void timelineQuery.refetch() }
                : { status: "loading" }
          }
        />
      </div>

      {dashboardQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden="true">
          <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />
          <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />
        </div>
      )}

      {dashboard && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
            <FinancialSummaryCard summary={dashboard.financial_summary} />
            <FuelSummarySection summary={dashboard.fuel_summary} />
          </div>

          <section aria-labelledby="dashboard-charts-title">
            <h2 id="dashboard-charts-title" className="sr-only">
              Gráficos de gastos
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
              <ExpensesByMonthChart data={dashboard.expenses_by_month} />
              <ExpensesByCategoryChart data={dashboard.expenses_by_category} />
            </div>
          </section>
        </>
      )}

      {/* Por último: é referência de mercado, não dado operacional. Não depende do RPC do painel pra aparecer. */}
      <VehicleFipeCard vehicle={vehicle} />
    </div>
  );
}
