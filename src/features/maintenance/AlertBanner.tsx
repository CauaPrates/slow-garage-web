import { AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateOnly, formatKm } from "@/lib/format";
import type { Database } from "@/types/database.types";

type VehicleAlert = Database["public"]["Views"]["vehicle_alerts"]["Row"];

type AlertBannerProps = {
  alerts: VehicleAlert[];
};

/**
 * Lê `vehicle_alerts` (propósito geral) — hoje só `maintenance_overdue`/
 * `maintenance_due_soon` existem de verdade, mas o componente não
 * assume isso: quando Documentos/Obrigações (Fases 7/8) passarem a
 * gerar `alert_type` próprio, este banner já funciona sem mudança.
 */
export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "critical";
        const Icon = isCritical ? AlertCircle : AlertTriangle;
        return (
          <div
            key={`${alert.source_table}-${alert.source_id}`}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-sm motion-safe:animate-alert-in",
              isCritical
                ? "border-error/40 bg-error/10 text-error"
                : "border-warning/40 bg-warning/10 text-warning",
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">{alert.title}</p>
              {(alert.due_on ?? alert.due_odometer_km != null) && (
                <p className="text-xs">
                  {alert.due_on ? `Venceu em ${formatDateOnly(alert.due_on)}` : ""}
                  {alert.due_on && alert.due_odometer_km != null ? " · " : ""}
                  {alert.due_odometer_km != null ? formatKm(alert.due_odometer_km) : ""}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
