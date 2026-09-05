import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { AlertBanner } from "./AlertBanner";
import { CreateMaintenanceItemDialog } from "./CreateMaintenanceItemDialog";
import { CreateMaintenanceRecordDialog } from "./CreateMaintenanceRecordDialog";
import { MaintenanceItemCard } from "./MaintenanceItemCard";
import { MaintenanceRecordListItem } from "./MaintenanceRecordListItem";
import { useMaintenanceItems } from "./useMaintenanceItems";
import { useMaintenanceRecords } from "./useMaintenanceRecords";
import { useVehicleAlerts } from "./useVehicleAlerts";

export function MaintenancePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [createRecordOpen, setCreateRecordOpen] = useState(() => searchParams.get("novo") === "1");
  const [preselectedItemId, setPreselectedItemId] = useState<string | null>(null);

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const itemsQuery = useMaintenanceItems(vehicleId ?? "");
  const recordsQuery = useMaintenanceRecords(vehicleId ?? "");
  const alertsQuery = useVehicleAlerts(vehicleId ?? "");

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRegisterExecution(itemId: string) {
    setPreselectedItemId(itemId);
    setCreateRecordOpen(true);
  }

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
        <p className="text-sm text-text-secondary">Não foi possível carregar a manutenção.</p>
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

  const items = (itemsQuery.data ?? []).filter((item) => item.is_active);
  const overdueItems = items.filter((item) => (item.status?.status ?? "planned") === "overdue");
  const upcomingItems = items.filter((item) => (item.status?.status ?? "planned") !== "overdue");
  const records = recordsQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const allItems = itemsQuery.data ?? [];

  const isLoading = itemsQuery.isLoading || recordsQuery.isLoading;
  const isError = itemsQuery.isError || recordsQuery.isError;

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb items={[{ label: "Manutenção" }]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-medium text-text-primary">Manutenção</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => setCreateItemOpen(true)}>
            Novo item do plano
          </Button>
          <Button
            onClick={() => {
              setPreselectedItemId(null);
              setCreateRecordOpen(true);
            }}
          >
            Registrar execução
          </Button>
        </div>
      </div>

      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar a manutenção.</p>
          <Button
            variant="ghost"
            onClick={() => {
              void itemsQuery.refetch();
              void recordsQuery.refetch();
            }}
          >
            Tentar de novo
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-text-secondary">Vencidas</h2>
            {overdueItems.length === 0 ? (
              <p className="text-sm text-text-secondary">Nenhuma manutenção vencida.</p>
            ) : (
              overdueItems.map((item) => (
                <MaintenanceItemCard
                  key={item.id}
                  vehicleId={vehicle.id}
                  item={item}
                  onRegisterExecution={handleRegisterExecution}
                />
              ))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-text-secondary">Próximas</h2>
            {upcomingItems.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-text-secondary">Nenhum item no plano ainda.</p>
                <Button variant="ghost" onClick={() => setCreateItemOpen(true)}>
                  Novo item do plano
                </Button>
              </div>
            ) : (
              upcomingItems.map((item) => (
                <MaintenanceItemCard
                  key={item.id}
                  vehicleId={vehicle.id}
                  item={item}
                  onRegisterExecution={handleRegisterExecution}
                />
              ))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-text-secondary">Histórico</h2>
            {records.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-text-secondary">Nenhuma execução registrada ainda.</p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPreselectedItemId(null);
                    setCreateRecordOpen(true);
                  }}
                >
                  Registrar execução
                </Button>
              </div>
            ) : (
              records.map((record) => (
                <MaintenanceRecordListItem
                  key={record.id}
                  vehicleId={vehicle.id}
                  record={record}
                  items={allItems}
                />
              ))
            )}
          </section>
        </>
      )}

      <CreateMaintenanceItemDialog
        vehicleId={vehicle.id}
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
      />
      <CreateMaintenanceRecordDialog
        vehicleId={vehicle.id}
        items={allItems}
        defaultOdometerKm={vehicle.current_odometer_km ?? undefined}
        preselectedItemId={preselectedItemId}
        open={createRecordOpen}
        onOpenChange={setCreateRecordOpen}
      />
    </div>
  );
}
