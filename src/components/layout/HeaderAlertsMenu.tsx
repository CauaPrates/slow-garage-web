import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/features/maintenance/AlertBanner";
import { useGarageAlerts } from "@/features/vehicle/useGarageAlerts";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";
import { cn } from "@/lib/utils";
import { HEADER_BADGE_CLASSNAME, HEADER_ICON_BUTTON_CLASSNAME, NAV_EYEBROW_CLASSNAME } from "./navStyles";

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
          aria-label={count > 0 ? `Alertas (${count}${hasCritical ? ", há vencidos" : ""})` : "Alertas"}
          className={HEADER_ICON_BUTTON_CLASSNAME}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                HEADER_BADGE_CLASSNAME,
                hasCritical ? "bg-error text-error-foreground" : "bg-warning text-warning-foreground",
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Alertas</h2>

        {alertsQuery.isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg bg-state-hover" />
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
          /*
            Etapa 07: com muitos alertas a lista rola, e nada dentro dela recebe
            foco (os alertas são texto) — sem `tabIndex`, quem usa teclado não
            alcançava o fim (axe `scrollable-region-focusable`). Focável e
            nomeada, as setas e o Page Down rolam a lista.
          */
          <div
            // Região rolável sem nada focável dentro é a exceção que o próprio WCAG/axe pede pra esta regra.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            role="region"
            aria-label="Lista de alertas"
            // `overscroll-contain`: chegar ao fim da lista pelo teclado não passa a rolar a página por trás.
            className="flex max-h-96 flex-col gap-3 overflow-y-auto overscroll-contain rounded-md"
          >
            {[...alertsByVehicle.entries()].map(([vehicleId, vehicleAlerts]) => (
              <div key={vehicleId} className="flex flex-col gap-2">
                {showVehicleLabel && (
                  <p className={`${NAV_EYEBROW_CLASSNAME} truncate`}>
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
