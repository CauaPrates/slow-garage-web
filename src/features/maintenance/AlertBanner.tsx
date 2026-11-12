import { AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateOnly, formatKm, todayDateOnly } from "@/lib/format";
import { dueDateLabel } from "./maintenancePresentation";
import type { Database } from "@/types/database.types";

type VehicleAlert = Database["public"]["Views"]["vehicle_alerts"]["Row"];

type AlertBannerProps = {
  alerts: VehicleAlert[];
};

/**
 * Etapa 07: a linha de prazo segue a data e a severidade que a view já
 * entrega, sem regra nova. Data passada "Venceu em", hoje "Vence hoje",
 * futura "Vence em". Um alerta `critical` cuja data ainda não chegou só
 * pode ter vencido pela quilometragem (a view de manutenção tem só esses dois
 * critérios; obrigação e documento não têm km) — aí o texto diz isso e a data
 * aparece como prevista, em vez de "Venceu em" com uma data futura.
 */
function alertDetail(alert: VehicleAlert, today: string): string | null {
  const km = alert.due_odometer_km != null ? formatKm(alert.due_odometer_km) : null;
  const dateReached = alert.due_on != null && alert.due_on <= today;
  if (alert.severity === "critical" && km && !dateReached) {
    return [`Venceu aos ${km}`, alert.due_on && `data prevista ${formatDateOnly(alert.due_on)}`]
      .filter(Boolean)
      .join(" · ");
  }
  const parts = [alert.due_on && dueDateLabel(alert.due_on, today), km && `previsto aos ${km}`].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Lê `vehicle_alerts` (propósito geral) — hoje só `maintenance_overdue`/
 * `maintenance_due_soon` existem de verdade, mas o componente não
 * assume isso: quando Documentos/Obrigações (Fases 7/8) passarem a
 * gerar `alert_type` próprio, este banner já funciona sem mudança.
 */
export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;
  const today = todayDateOnly();

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => {
        const isCritical = alert.severity === "critical";
        const Icon = isCritical ? AlertCircle : AlertTriangle;
        const detail = alertDetail(alert, today);
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
              {detail && <p className="text-xs">{detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
