import type { MouseEvent } from "react";
import { AlertCircle, ArrowDown } from "lucide-react";
import type { VehicleAlert } from "./types";

type CriticalAlertsNoticeProps = {
  alerts: VehicleAlert[];
  /** `id` do título do painel de pendências — destino do link. */
  targetId: string;
};

/**
 * Etapa 05: com os gráficos subindo pra logo depois dos indicadores, o painel
 * de pendências desceu — este aviso mantém o que está **vencido** (`critical`
 * em `vehicle_alerts`) visível no topo, com os nomes e um link que leva (e
 * move o foco) pro painel completo. Os mesmos dados do painel; nada novo é
 * contado. Sem vencidas, não aparece.
 */
export function CriticalAlertsNotice({ alerts, targetId }: CriticalAlertsNoticeProps) {
  const critical = alerts.filter((alert) => alert.severity === "critical");
  if (critical.length === 0) return null;

  function goToPending(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.tabIndex = -1;
    target.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    target.focus({ preventScroll: true });
  }

  const count = critical.length;
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-l-2 border-border border-l-error bg-surface py-2 pr-2 pl-4 sm:flex-row sm:items-center sm:gap-3">
      <p className="flex min-w-0 flex-1 items-start gap-2 py-1 text-sm">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" aria-hidden="true" />
        <span className="min-w-0">
          <span className="font-semibold text-error">
            {count} {count === 1 ? "pendência vencida" : "pendências vencidas"}
          </span>
          <span className="break-words text-text-secondary">
            {" · "}
            {critical.map((alert) => alert.title ?? "Sem título").join(" · ")}
          </span>
        </span>
      </p>
      <a
        href={`#${targetId}`}
        onClick={goToPending}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-md px-2 text-sm font-medium text-text-primary underline decoration-border-strong underline-offset-4 hover:decoration-text-primary sm:self-auto"
      >
        Ver pendências
        <ArrowDown className="h-4 w-4 text-accent" aria-hidden="true" />
      </a>
    </div>
  );
}
