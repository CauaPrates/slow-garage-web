import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateFuelLogDialog } from "./CreateFuelLogDialog";
import { FuelLogListItem } from "./FuelLogListItem";
import { FuelSummaryCard } from "./FuelSummaryCard";
import { useFuelLogs } from "./useFuelLogs";
import { useVehicleFuelSummary } from "./useVehicleFuelSummary";

export function FuelLogsPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(() => searchParams.get("novo") === "1");

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const logsQuery = useFuelLogs(vehicleId ?? "");
  const summaryQuery = useVehicleFuelSummary(vehicleId ?? "");

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vehicleLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
        <div className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
        <div className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar os abastecimentos.</p>
        <Button variant="ghost" onClick={() => refetchVehicle()}>
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

  const logs = logsQuery.data ?? [];
  const summary = summaryQuery.data;

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb items={[{ label: "Abastecimentos" }]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-medium text-text-primary">Abastecimentos</h1>
        <Button onClick={() => setCreateOpen(true)}>Registrar abastecimento</Button>
      </div>

      {logs.length > 0 && (
        <FuelSummaryCard
          avgKmPerLiter={summary?.avg_km_per_liter ?? null}
          bestKmPerLiter={summary?.best_km_per_liter ?? null}
          worstKmPerLiter={summary?.worst_km_per_liter ?? null}
          costPerKm={vehicle.financialSummary?.cost_per_km ?? null}
        />
      )}

      {logsQuery.isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {logsQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar os abastecimentos.</p>
          <Button variant="ghost" onClick={() => logsQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!logsQuery.isLoading && !logsQuery.isError && logs.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-text-primary">Nenhum abastecimento registrado ainda.</p>
          <Button onClick={() => setCreateOpen(true)}>Registrar primeiro abastecimento</Button>
        </div>
      )}

      {!logsQuery.isLoading && !logsQuery.isError && logs.length > 0 && (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <FuelLogListItem key={log.id} vehicleId={vehicle.id} log={log} />
          ))}
        </div>
      )}

      <CreateFuelLogDialog
        vehicleId={vehicle.id}
        defaultFuelType={vehicle.fuel_type}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
