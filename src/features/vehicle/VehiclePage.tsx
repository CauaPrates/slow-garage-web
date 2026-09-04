import { AlertCircle, Car } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatKm } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { AlertBanner } from "@/features/maintenance/AlertBanner";
import { ActivityCountTiles } from "@/features/dashboard/ActivityCountTiles";
import { ExpensesByCategoryChart } from "@/features/dashboard/ExpensesByCategoryChart";
import { ExpensesByMonthChart } from "@/features/dashboard/ExpensesByMonthChart";
import { FinancialSummaryCard } from "@/features/dashboard/FinancialSummaryCard";
import { FuelSummarySection } from "@/features/dashboard/FuelSummarySection";
import { useVehicleDashboard } from "@/features/dashboard/useVehicleDashboard";
import { VEHICLE_STATUS_LABELS } from "./schemas";
import { useVehicle, useVehicles } from "./useVehicles";

export function VehiclePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { vehicle, isLoading, isError, refetch } = useVehicle(vehicleId ?? "");
  const { data: allVehicles } = useVehicles();
  const dashboardQuery = useVehicleDashboard(vehicleId ?? "");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />
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

  const otherVehicles = allVehicles ?? [];
  const dashboard = dashboardQuery.data;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-surface sm:w-56">
          {vehicle.photoUrl ? (
            <img
              src={vehicle.photoUrl}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Car className="h-10 w-10 text-text-secondary" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-medium text-text-primary">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-sm text-text-secondary">
                {vehicle.model_year}
                {vehicle.trim ? ` · ${vehicle.trim}` : ""} ·{" "}
                {vehicle.current_odometer_km != null ? formatKm(vehicle.current_odometer_km) : "—"}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-text-secondary">
              {VEHICLE_STATUS_LABELS[vehicle.status]}
            </span>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Trocar de veículo</span>
            <select
              value={vehicle.id}
              disabled={otherVehicles.length <= 1}
              onChange={(event) => navigate(ROUTES.vehicle(event.target.value))}
              className="h-11 rounded-md border border-border bg-bg px-3 text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {otherVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.model_year})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {dashboardQuery.isLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {dashboardQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar o painel do veículo.</p>
          <Button variant="ghost" onClick={() => dashboardQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {dashboard && (
        <>
          {dashboard.alerts.length > 0 && <AlertBanner alerts={dashboard.alerts} />}

          <FinancialSummaryCard summary={dashboard.financial_summary} />
          <FuelSummarySection summary={dashboard.fuel_summary} />
          <ActivityCountTiles
            vehicleId={vehicle.id}
            openIssuesCount={dashboard.open_issues_count}
            activeProjectsCount={dashboard.active_projects_count}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ExpensesByMonthChart data={dashboard.expenses_by_month} />
            <ExpensesByCategoryChart data={dashboard.expenses_by_category} />
          </div>
        </>
      )}
    </div>
  );
}
