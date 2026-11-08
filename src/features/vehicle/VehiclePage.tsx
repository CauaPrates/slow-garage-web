import { AlertCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useMaintenanceItems } from "@/features/maintenance/useMaintenanceItems";
import { CriticalAlertsNotice } from "@/features/dashboard/CriticalAlertsNotice";
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
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { useVehicle, type VehicleWithSummary } from "./useVehicles";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_CLASSNAME = "flex flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6";

export function VehiclePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { vehicle, isLoading, isError, refetch } = useVehicle(vehicleId ?? "");

  if (isLoading) {
    return (
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando veículo…</span>
        <Skeleton className="h-28 rounded-lg border border-border bg-surface sm:h-36" />
        <Skeleton className="h-14 rounded-lg border border-border bg-surface sm:h-11" />
        <Skeleton className="h-24 rounded-lg border border-border bg-surface" />
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
    return <VehicleNotFound />;
  }

  // `key`: ao trocar de veículo pelo seletor do cabeçalho a rota é a mesma, então
  // sem isso expansões abertas e diálogos do veículo anterior continuariam montados.
  return <VehicleDashboard key={vehicle.id} vehicle={vehicle} />;
}

const PENDING_TITLE_ID = "dashboard-pending-title";

/**
 * Etapa 05: os gráficos sobem pra logo depois dos indicadores — viram a
 * camada de análise da página, em vez de ficar depois de atividade e
 * resumos. As pendências vencidas não somem do topo: um aviso compacto
 * (`CriticalAlertsNotice`) fica entre indicadores e gráficos e leva ao
 * painel completo. Os gráficos usam os mesmos dados do RPC do painel.
 */
function DashboardCharts({
  vehicleId,
  query,
}: {
  vehicleId: string;
  query: ReturnType<typeof useVehicleDashboard>;
}) {
  const dashboard = query.data;
  const registerExpense = (
    <Link to={`${ROUTES.vehicleExpenses(vehicleId)}?novo=1`} className={buttonVariants({ variant: "outline" })}>
      Registrar gasto
    </Link>
  );

  return (
    <section aria-labelledby="dashboard-charts-title" className="flex flex-col gap-3">
      <h2
        id="dashboard-charts-title"
        className="text-xs font-medium tracking-[0.08em] text-text-secondary uppercase"
      >
        Análise de gastos
      </h2>

      {query.isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true">
          <span className="sr-only">Carregando gráficos…</span>
          <Skeleton className="h-72 rounded-lg border border-border bg-surface" />
          <Skeleton className="h-72 rounded-lg border border-border bg-surface" />
        </div>
      )}

      {query.isError && !dashboard && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4">
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            Não foi possível carregar os gráficos de gastos.
          </p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {dashboard &&
        (dashboard.expenses_by_month.length === 0 && dashboard.expenses_by_category.length === 0 ? (
          // Sem nenhum registro com valor: um estado vazio só, em vez de dois quadros vazios lado a lado.
          <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">
              Nenhum registro com valor ainda. Gasto por mês e por categoria aparecem a partir do primeiro
              lançamento.
            </p>
            {registerExpense}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ExpensesByMonthChart data={dashboard.expenses_by_month} emptyAction={registerExpense} />
            <ExpensesByCategoryChart data={dashboard.expenses_by_category} emptyAction={registerExpense} />
          </div>
        ))}
    </section>
  );
}

/**
 * Etapa 04: identificação compacta → ações → indicadores → pendências e
 * atividade → financeiro e combustível → gráficos → FIPE. Etapa 05: os
 * gráficos (e o aviso de vencidas) sobem pra antes de pendências e
 * atividade. Cada bloco carrega e falha sozinho; o RPC do painel continua
 * sendo uma chamada só (RN-1), e as consultas são as mesmas de antes, todas
 * por `vehicleId` — dado de um veículo nunca aparece no outro durante a troca.
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

      {dashboard && <CriticalAlertsNotice alerts={dashboard.alerts} targetId={PENDING_TITLE_ID} />}

      <DashboardCharts vehicleId={vehicle.id} query={dashboardQuery} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PendingAlertsPanel
          vehicleId={vehicle.id}
          titleId={PENDING_TITLE_ID}
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
          <Skeleton className="h-40 rounded-lg border border-border bg-surface" />
          <Skeleton className="h-40 rounded-lg border border-border bg-surface" />
        </div>
      )}

      {dashboard && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <FinancialSummaryCard summary={dashboard.financial_summary} />
          <FuelSummarySection summary={dashboard.fuel_summary} />
        </div>
      )}

      {/* Por último: é referência de mercado, não dado operacional. Não depende do RPC do painel pra aparecer. */}
      <VehicleFipeCard vehicle={vehicle} />
    </div>
  );
}
