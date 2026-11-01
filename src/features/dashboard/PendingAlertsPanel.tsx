import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateOnly, formatKm } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { DashboardPanel } from "./DashboardPanel";
import type { VehicleAlert } from "./types";

type PendingAlertsPanelProps = {
  vehicleId: string;
  /** `id` fixo do título — o aviso de vencidas do topo aponta pra ele. */
  titleId?: string;
  currentOdometerKm: number | null;
  query:
    | { status: "loading" }
    | { status: "error"; onRetry: () => void }
    | { status: "ready"; alerts: VehicleAlert[]; openIssuesCount: number; activeProjectsCount: number };
};

/** Avisos (`warning`) que aparecem antes de "Mostrar mais". Vencidos (`critical`) aparecem sempre, todos. */
const VISIBLE_WARNINGS = 3;

type AlertSource = { kind: string; overdue: string; soon: string; destination: string; href: string };

/**
 * De onde a pendência vem e onde ela é tratada hoje — as telas que já
 * mostram esses alertas (Manutenção e Documentos, aba Obrigações). Fonte
 * desconhecida (a view ganhou outra) continua aparecendo, só sem link.
 */
function alertSource(vehicleId: string, alert: VehicleAlert): AlertSource | null {
  switch (alert.source_table) {
    case "maintenance_items":
      return { kind: "Manutenção", overdue: "Vencida", soon: "Próxima", destination: "Manutenção", href: ROUTES.vehicleMaintenance(vehicleId) };
    case "obligations":
      return { kind: "Obrigação", overdue: "Vencida", soon: "Próxima", destination: "Obrigações", href: `${ROUTES.vehicleDocuments(vehicleId)}?aba=obrigacoes` };
    case "documents":
      return { kind: "Documento", overdue: "Vencido", soon: "Vence em breve", destination: "Documentos", href: ROUTES.vehicleDocuments(vehicleId) };
    default:
      return null;
  }
}

/** Vencidos primeiro; dentro de cada grupo, o prazo mais próximo primeiro (sem data vai pro fim). */
function sortAlerts(alerts: VehicleAlert[]): VehicleAlert[] {
  return [...alerts].sort((a, b) => {
    const severity = Number(b.severity === "critical") - Number(a.severity === "critical");
    if (severity !== 0) return severity;
    if (a.due_on && b.due_on) return a.due_on.localeCompare(b.due_on);
    if (a.due_on) return -1;
    if (b.due_on) return 1;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}

/**
 * Distância só quando a própria pendência traz o km previsto e o veículo tem
 * odômetro — é a conta "previsto − atual" com as duas pontas à vista, nunca
 * uma meta inventada.
 */
function kmDetail(dueKm: number | null, currentKm: number | null): string | null {
  if (dueKm == null) return null;
  const base = `previsto aos ${formatKm(dueKm)}`;
  if (currentKm == null) return base;
  const diff = dueKm - currentKm;
  if (diff > 0) return `${base} (faltam ${formatKm(diff)})`;
  if (diff < 0) return `${base} (passou ${formatKm(-diff)})`;
  return `${base} (atingido)`;
}

function AlertRow({ alert, vehicleId, currentOdometerKm }: { alert: VehicleAlert; vehicleId: string; currentOdometerKm: number | null }) {
  const critical = alert.severity === "critical";
  const Icon = critical ? AlertCircle : AlertTriangle;
  const source = alertSource(vehicleId, alert);
  const date = alert.due_on ? `${critical ? "Venceu em" : "Vence em"} ${formatDateOnly(alert.due_on)}` : null;
  const detail = [date, kmDetail(alert.due_odometer_km, currentOdometerKm)].filter(Boolean).join(" · ");

  const content = (
    <>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", critical ? "text-error" : "text-warning")} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-x-2 text-xs">
          <span className={cn("font-semibold", critical ? "text-error" : "text-warning")}>
            {critical ? (source?.overdue ?? "Vencido") : (source?.soon ?? "Próximo")}
          </span>
          {source && <span className="text-text-secondary">{source.kind}</span>}
        </span>
        <span className="text-sm font-medium break-words text-text-primary">{alert.title ?? "Sem título"}</span>
        {detail && <span className="text-xs text-text-secondary">{detail}</span>}
      </span>
      {source && (
        <span className="flex shrink-0 items-center gap-1 self-center text-xs text-text-secondary">
          <span className="hidden sm:inline">Ver em {source.destination}</span>
          <span className="sr-only sm:hidden">Ver em {source.destination}</span>
          <ChevronRight className="h-4 w-4 text-accent" aria-hidden="true" />
        </span>
      )}
    </>
  );

  return (
    <li>
      {source ? (
        <Link
          to={source.href}
          className="flex min-h-11 items-start gap-3 px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-state-hover"
        >
          {content}
        </Link>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3">{content}</div>
      )}
    </li>
  );
}

function CountLink({ to, label, count }: { to: string; label: string; count: number | null }) {
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors duration-(--duration-fast) hover:bg-state-hover"
    >
      <span className="text-text-secondary">{label}</span>
      <span className="flex items-center gap-1 font-mono text-text-primary">
        {count ?? "—"}
        <ChevronRight className="h-4 w-4 text-accent" aria-hidden="true" />
      </span>
    </Link>
  );
}

/**
 * Etapa 04: o que exige ação. Fonte única — os `alerts` do
 * `get_vehicle_dashboard` (`vehicle_alerts`: manutenção, obrigação e
 * documento; `critical` = vencido, `warning` = próximo). Texto e ícone além
 * da cor. Vencidos nunca ficam atrás de expansão; só avisos além dos 3
 * primeiros. Erro de consulta nunca vira "nada pendente".
 *
 * Problemas abertos e projetos ativos ficam no rodapé, cada um com o próprio
 * rótulo e destino — são outra natureza de informação e não entram na
 * contagem de pendências.
 */
export function PendingAlertsPanel({ vehicleId, titleId, currentOdometerKm, query }: PendingAlertsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const moreId = useId();

  const ready = query.status === "ready";
  const sorted = ready ? sortAlerts(query.alerts) : [];
  const criticalCount = sorted.filter((a) => a.severity === "critical").length;
  const warningCount = sorted.length - criticalCount;
  const visible = sorted.slice(0, criticalCount + VISIBLE_WARNINGS);
  const hidden = sorted.slice(criticalCount + VISIBLE_WARNINGS);

  const summary = [
    criticalCount > 0 && `${criticalCount} ${criticalCount === 1 ? "vencida" : "vencidas"}`,
    warningCount > 0 && `${warningCount} ${warningCount === 1 ? "próxima" : "próximas"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <DashboardPanel
      titleId={titleId}
      title={
        <span className="flex items-center gap-2">
          Pendências
          {ready && sorted.length > 0 && (
            // A contagem já está na descrição ("2 vencidas · 2 próximas"); aqui é só reforço visual, fora do nome do título.
            <span
              aria-hidden="true"
              className={cn(
                "rounded-full px-1.5 py-px font-mono text-xs font-medium",
                criticalCount > 0 ? "bg-error/10 text-error" : "bg-warning/10 text-warning",
              )}
            >
              {sorted.length}
            </span>
          )}
        </span>
      }
      description={ready && summary ? summary : "Manutenção, obrigações e documentos."}
    >
      {query.status === "loading" && (
        <div className="flex flex-col gap-2 p-4" aria-hidden="true">
          <div className="h-12 animate-pulse rounded-md bg-state-hover" />
          <div className="h-12 animate-pulse rounded-md bg-state-hover" />
        </div>
      )}

      {query.status === "error" && (
        <div className="flex flex-col items-start gap-2 p-4">
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            Não foi possível carregar as pendências.
          </p>
          <Button variant="outline" onClick={query.onRetry}>
            Tentar de novo
          </Button>
        </div>
      )}

      {ready && sorted.length === 0 && (
        <p className="flex items-start gap-2 px-4 py-4 text-sm text-text-secondary">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          Nenhuma manutenção, obrigação ou documento vencido ou perto de vencer.
        </p>
      )}

      {ready && sorted.length > 0 && (
        <>
          <ul className="divide-y divide-border">
            {visible.map((alert) => (
              <AlertRow
                key={`${alert.source_table}-${alert.source_id}`}
                alert={alert}
                vehicleId={vehicleId}
                currentOdometerKm={currentOdometerKm}
              />
            ))}
          </ul>
          {hidden.length > 0 && (
            <>
              <ul id={moreId} hidden={!showAll} className="divide-y divide-border border-t border-border">
                {hidden.map((alert) => (
                  <AlertRow
                    key={`${alert.source_table}-${alert.source_id}`}
                    alert={alert}
                    vehicleId={vehicleId}
                    currentOdometerKm={currentOdometerKm}
                  />
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setShowAll((current) => !current)}
                aria-expanded={showAll}
                aria-controls={moreId}
                className="flex min-h-11 items-center border-t border-border px-4 text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
              >
                {showAll ? "Mostrar menos" : `Mostrar mais ${hidden.length} ${hidden.length === 1 ? "próxima" : "próximas"}`}
              </button>
            </>
          )}
        </>
      )}

      <div className="mt-auto grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <CountLink
          to={ROUTES.vehicleIssues(vehicleId)}
          label="Problemas abertos"
          count={ready ? query.openIssuesCount : null}
        />
        <CountLink
          to={ROUTES.vehicleProjects(vehicleId)}
          label="Projetos ativos"
          count={ready ? query.activeProjectsCount : null}
        />
      </div>
    </DashboardPanel>
  );
}
