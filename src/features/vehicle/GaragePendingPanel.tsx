import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { InlineError } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { alertSource, sortAlerts } from "@/features/dashboard/PendingAlertsPanel";
import { alertDetail } from "@/features/maintenance/AlertBanner";
import { formatDateOnly, todayDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGarageAlerts, type GarageAlert } from "./useGarageAlerts";
import { useGarageMaintenance } from "./useGarageMaintenance";
import type { VehicleWithSummary } from "./useVehicles";

/** Vencidas aparecem todas; das próximas, as primeiras — o resto atrás de "Mostrar mais" (como o painel do dashboard). */
const VISIBLE_WARNINGS = 4;

function PendingRow({ alert, vehicleLabel, today }: { alert: GarageAlert; vehicleLabel: string | null; today: string }) {
  const critical = alert.severity === "critical";
  const Icon = critical ? AlertCircle : AlertTriangle;
  const source = alertSource(alert.vehicle_id, alert);
  const detail = alertDetail(alert, today);

  const content = (
    <>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", critical ? "text-error" : "text-warning")} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col">
        {vehicleLabel && <span className="type-overline break-words text-text-secondary">{vehicleLabel}</span>}
        <span className="type-caption flex flex-wrap gap-x-1.5">
          <span className={cn("font-semibold", critical ? "text-error" : "text-warning")}>
            {critical ? (source?.overdue ?? "Vencido") : (source?.soon ?? "Próximo")}
          </span>
          {source && <span className="text-text-secondary">{source.kind}</span>}
        </span>
        <span className="type-item-title text-text-primary">{alert.title ?? "Sem título"}</span>
        {detail && <span className="type-caption text-text-secondary">{detail}</span>}
        {source && <span className="sr-only">Ver em {source.destination}</span>}
      </span>
      {source && <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 self-center text-accent" aria-hidden="true" />}
    </>
  );

  return (
    <li>
      {source ? (
        <Link
          to={source.href}
          className="flex min-h-11 items-start gap-2.5 px-(--panel-pad-x) py-2.5 transition-colors duration-(--duration-fast) hover:bg-state-hover"
        >
          {content}
        </Link>
      ) : (
        <div className="flex items-start gap-2.5 px-(--panel-pad-x) py-2.5">{content}</div>
      )}
    </li>
  );
}

/**
 * Lateral da coleção (13/11/2026, a pedido) com **um veículo só**: em tela
 * larga a grade para no teto dela (ADR-095) e sobrava uma faixa vazia à
 * direita. Com 2+ veículos ali fica "Detalhes e comparativo"; com um, que não
 * tem comparativo, entra o que o resumo do topo só conta — "Pendências: 4 · 2
 * vencidas" — por extenso: o que vence e o link para a tela onde se resolve
 * (Manutenção; Documentos, aba Obrigações ou Documentos).
 *
 * Mesmos dados do resumo e do sino (`useGarageAlerts`, mesmo cache), mesmas
 * regras de texto do sino: rótulos do painel de pendências do dashboard
 * (`alertSource`) e a linha de prazo do `AlertBanner` (`alertDetail`), ordem
 * do dashboard (`sortAlerts`). Nada pendente: a próxima manutenção prevista
 * (`useGarageMaintenance`, o mesmo dado de "Manutenção prevista").
 *
 * Só aparece quando a coleção tem largura para ela (`garage.css`,
 * `.garage-aside`); abaixo disso a página é a de antes.
 */
export function GaragePendingPanel({ vehicles }: { vehicles: VehicleWithSummary[] }) {
  const ids = vehicles.map((v) => v.id);
  const alertsQuery = useGarageAlerts(ids);
  const maintenanceQuery = useGarageMaintenance(ids);
  const [showAll, setShowAll] = useState(false);
  const moreId = useId();
  const today = todayDateOnly();
  const showVehicle = vehicles.length > 1;
  const labelById = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model}`]));
  const label = (id: string) => (showVehicle ? (labelById.get(id) ?? null) : null);

  const sorted = sortAlerts(alertsQuery.data ?? []);
  const criticalCount = sorted.filter((a) => a.severity === "critical").length;
  const visible = sorted.slice(0, criticalCount + VISIBLE_WARNINGS);
  const hidden = sorted.slice(criticalCount + VISIBLE_WARNINGS);
  const warningCount = sorted.length - criticalCount;
  const summary = [
    criticalCount > 0 && `${criticalCount} ${criticalCount === 1 ? "vencida" : "vencidas"}`,
    warningCount > 0 && `${warningCount} ${warningCount === 1 ? "próxima" : "próximas"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const next = maintenanceQuery.data?.[0] ?? null;

  return (
    <Panel
      title="Pendências da garagem"
      description={alertsQuery.data && sorted.length > 0 ? summary : "Vencidas e a vencer em até 30 dias."}
    >
      {alertsQuery.isLoading && <SkeletonList label="Carregando pendências…" rows={3} />}

      {alertsQuery.isError && (
        <InlineError onRetry={() => alertsQuery.refetch()}>Não foi possível carregar as pendências.</InlineError>
      )}

      {alertsQuery.data && sorted.length === 0 && (
        <div className="flex flex-col gap-3 px-(--panel-pad-x) py-4 text-sm">
          <p className="flex items-start gap-2 text-text-secondary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            Nenhuma manutenção, obrigação ou documento vencido ou perto de vencer.
          </p>
          {next && (
            <p className="flex flex-col border-t border-border pt-3">
              <span className="type-overline text-text-secondary">Próxima manutenção prevista</span>
              <span className="type-item-title text-text-primary">{next.name ?? "Sem nome"}</span>
              <span className="type-caption text-text-secondary">
                {[formatDateOnly(next.next_service_date), label(next.vehicle_id)].filter(Boolean).join(" · ")}
              </span>
            </p>
          )}
        </div>
      )}

      {sorted.length > 0 && (
        <>
          <ul className="divide-y divide-border">
            {visible.map((alert) => (
              <PendingRow
                key={`${alert.vehicle_id}-${alert.source_table}-${alert.source_id}`}
                alert={alert}
                vehicleLabel={label(alert.vehicle_id)}
                today={today}
              />
            ))}
          </ul>
          {hidden.length > 0 && (
            <>
              <ul id={moreId} hidden={!showAll} className="divide-y divide-border border-t border-border">
                {hidden.map((alert) => (
                  <PendingRow
                    key={`${alert.vehicle_id}-${alert.source_table}-${alert.source_id}`}
                    alert={alert}
                    vehicleLabel={label(alert.vehicle_id)}
                    today={today}
                  />
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setShowAll((open) => !open)}
                aria-expanded={showAll}
                aria-controls={moreId}
                className="flex min-h-11 items-center border-t border-border px-(--panel-pad-x) text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
              >
                {showAll ? "Mostrar menos" : `Mostrar mais ${hidden.length} ${hidden.length === 1 ? "próxima" : "próximas"}`}
              </button>
            </>
          )}
        </>
      )}
    </Panel>
  );
}
