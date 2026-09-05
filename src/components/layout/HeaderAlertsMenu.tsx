import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/features/maintenance/AlertBanner";
import { useGarageAlerts } from "@/features/vehicle/useGarageAlerts";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";
import { cn } from "@/lib/utils";

type HeaderAlertsMenuProps = {
  vehicles: VehicleWithSummary[];
};

/**
 * Sino com contagem de alertas de todos os veículos (mesma fonte de dado do
 * `AlertBanner`/`vehicle_alerts`, ver ADR-051/053 pro padrão de agregação
 * sem RPC). Badge só aparece com `count > 0`; cor vem da severidade real
 * (nunca decorativa) — `--color-error` se houver algo vencido
 * (`critical`), `--color-warning` se só houver "próximo de vencer".
 */
export function HeaderAlertsMenu({ vehicles }: HeaderAlertsMenuProps) {
  const alertsQuery = useGarageAlerts(vehicles.map((v) => v.id));
  const alerts = alertsQuery.data ?? [];
  const count = alerts.length;
  const hasCritical = alerts.some((alert) => alert.severity === "critical");
  const showVehicleLabel = vehicles.length > 1;
  const vehicleLabelById = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model}`]));

  const alertsByVehicle = new Map<string, typeof alerts>();
  for (const alert of alerts) {
    const list = alertsByVehicle.get(alert.vehicle_id) ?? [];
    list.push(alert);
    alertsByVehicle.set(alert.vehicle_id, list);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={count > 0 ? `Alertas (${count})` : "Alertas"}
          className="relative"
        >
          <Bell className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          {count > 0 && (
            <span
              className={cn(
                "absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-accent-foreground",
                hasCritical ? "bg-error" : "bg-warning",
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 text-sm font-medium text-text-primary">Alertas</h2>

        {alertsQuery.isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-bg" />
            ))}
          </div>
        )}

        {alertsQuery.isError && (
          <p className="text-sm text-text-secondary">Não foi possível carregar os alertas.</p>
        )}

        {alertsQuery.data && count === 0 && (
          <p className="text-sm text-text-secondary">Nenhum alerta ativo.</p>
        )}

        {alertsQuery.data && count > 0 && (
          <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
            {[...alertsByVehicle.entries()].map(([vehicleId, vehicleAlerts]) => (
              <div key={vehicleId} className="flex flex-col gap-2">
                {showVehicleLabel && (
                  <p className="text-xs font-medium tracking-wide text-text-secondary uppercase">
                    {vehicleLabelById.get(vehicleId) ?? ""}
                  </p>
                )}
                <AlertBanner alerts={vehicleAlerts} />
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
