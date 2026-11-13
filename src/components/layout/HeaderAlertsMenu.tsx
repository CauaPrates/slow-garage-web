import { useId, useRef } from "react";
import { AlertCircle, AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { SkeletonList } from "@/components/ui/skeleton";
import { alertSource, sortAlerts } from "@/features/dashboard/PendingAlertsPanel";
import { alertDetail } from "@/features/maintenance/AlertBanner";
import { useGarageAlerts, type GarageAlert } from "@/features/vehicle/useGarageAlerts";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";
import { todayDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import {
  HEADER_BADGE_CLASSNAME,
  HEADER_ICON_BUTTON_CLASSNAME,
  HEADER_POPOVER_CLASSNAME,
  HEADER_POPOVER_LIST_CLASSNAME,
  NAV_EYEBROW_CLASSNAME,
} from "./navStyles";

type HeaderAlertsMenuProps = {
  vehicles: VehicleWithSummary[];
};

/**
 * Etapa 15 — uma pendência no sino: a situação e a origem escritas ("Vencida ·
 * Manutenção", com os rótulos do painel de pendências do dashboard), o item e
 * o motivo — a linha de prazo do `AlertBanner` (Manutenção, Documentos), que
 * já separa vencimento por data ("Venceu em…", "Vence hoje", "Vence em…") e
 * por quilometragem ("Venceu aos 87.000 km · data prevista…"). Nenhuma regra
 * nova: situação = `severity` da view; prazo = a mesma função de antes.
 * Ícone e cor reforçam; o texto diz.
 *
 * Sem link, como antes (a ausência de destino no sino é pendência registrada).
 */
function BellAlertRow({ alert, today }: { alert: GarageAlert; today: string }) {
  const critical = alert.severity === "critical";
  const Icon = critical ? AlertCircle : AlertTriangle;
  const source = alertSource(alert.vehicle_id, alert);
  const detail = alertDetail(alert, today);

  return (
    <li className="flex items-start gap-2.5 py-2">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", critical ? "text-error" : "text-warning")} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="type-caption flex flex-wrap gap-x-1.5">
          <span className={cn("font-semibold", critical ? "text-error" : "text-warning")}>
            {critical ? (source?.overdue ?? "Vencido") : (source?.soon ?? "Próximo")}
          </span>
          {source && <span className="text-text-secondary">{source.kind}</span>}
        </p>
        <p className="type-item-title text-text-primary">{alert.title ?? "Sem título"}</p>
        {detail && <p className="type-caption text-text-secondary">{detail}</p>}
      </div>
    </li>
  );
}

function BellVehicleGroup({ label, alerts, today }: { label: string | null; alerts: GarageAlert[]; today: string }) {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={label ? headingId : undefined} className="pt-2 first:pt-0">
      {/* O nome inteiro do veículo, quebrando em linhas (antes era cortado com reticências). */}
      {label && (
        <h3 id={headingId} className={cn(NAV_EYEBROW_CLASSNAME, "break-words")}>
          {label}
        </h3>
      )}
      <ul className="flex flex-col divide-y divide-border">
        {sortAlerts(alerts).map((alert) => (
          <BellAlertRow key={`${alert.source_table}-${alert.source_id}`} alert={alert} today={today} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Sino com contagem de alertas de todos os veículos (mesma fonte de dado do
 * `AlertBanner`/`vehicle_alerts`, ver ADR-051/053 pro padrão de agregação
 * sem RPC). Badge só aparece com `count > 0`; cor vem da severidade real
 * (nunca decorativa) — `--color-error` se houver algo vencido
 * (`critical`), `--color-warning` se só houver "próximo de vencer".
 *
 * Etapa 15: agrupado por veículo (na ordem em que a consulta entrega — os de
 * vencido primeiro) e, dentro do veículo, a ordem do painel de pendências do
 * dashboard: vencidos, depois o prazo mais próximo. Um resumo ("5 vencidas ·
 * 9 próximas") sob o título. Carregando, falha (com "Tentar de novo") e vazio
 * são estados distintos. A lista continua sendo a região focável da etapa 07
 * (setas e Page Down rolam; o fim dela não rola a página de fundo).
 */
export function HeaderAlertsMenu({ vehicles }: HeaderAlertsMenuProps) {
  const alertsQuery = useGarageAlerts(vehicles.map((v) => v.id));
  const alerts = alertsQuery.data ?? [];
  const count = alerts.length;
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const hasCritical = criticalCount > 0;
  const showVehicleLabel = vehicles.length > 1;
  const vehicleLabelById = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model}`]));
  const today = todayDateOnly();
  const bodyRef = useRef<HTMLDivElement>(null);
  const retry = useRetryFocus(alertsQuery.dataUpdatedAt, bodyRef);

  const alertsByVehicle = new Map<string, GarageAlert[]>();
  for (const alert of alerts) {
    const list = alertsByVehicle.get(alert.vehicle_id) ?? [];
    list.push(alert);
    alertsByVehicle.set(alert.vehicle_id, list);
  }

  const summary = [
    criticalCount > 0 && `${criticalCount} ${criticalCount === 1 ? "vencida" : "vencidas"}`,
    count - criticalCount > 0 && `${count - criticalCount} ${count - criticalCount === 1 ? "próxima" : "próximas"}`,
    showVehicleLabel && alertsByVehicle.size > 1 && `${alertsByVehicle.size} veículos`,
  ]
    .filter(Boolean)
    .join(" · ");

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
      <PopoverContent className={HEADER_POPOVER_CLASSNAME} aria-labelledby="header-alerts-title">
        <div className="mb-2 flex shrink-0 flex-col">
          <h2 id="header-alerts-title" className="type-section-title text-text-primary">
            Alertas
          </h2>
          <p className="type-caption text-text-secondary">
            {alertsQuery.data && count > 0 ? summary : "Manutenção, obrigações e documentos."}
          </p>
        </div>

        {/* Corpo do popover: depois de "Tentar de novo" o foco vem para cá (antes caía no <body>). */}
        <div ref={bodyRef} tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
          {alertsQuery.isLoading && <SkeletonList label="Carregando alertas…" rows={2} className="p-0" />}

          {alertsQuery.isError && (
            <InlineError onRetry={() => retry(alertsQuery.refetch)} className="p-0">
              Não foi possível carregar os alertas.
            </InlineError>
          )}

          {alertsQuery.data && count === 0 && (
            <p className="flex items-start gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              Nenhuma manutenção, obrigação ou documento vencido ou perto de vencer.
            </p>
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
              // `overscroll-contain` (na classe da lista): chegar ao fim pelo teclado não passa a rolar a página por trás.
              className={cn(HEADER_POPOVER_LIST_CLASSNAME, "rounded-md")}
            >
              {[...alertsByVehicle.entries()].map(([vehicleId, vehicleAlerts]) => (
                <BellVehicleGroup
                  key={vehicleId}
                  label={showVehicleLabel ? (vehicleLabelById.get(vehicleId) ?? null) : null}
                  alerts={vehicleAlerts}
                  today={today}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
