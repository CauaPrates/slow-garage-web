import type { MouseEvent } from "react";
import { ArrowDown } from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import { textLinkClassName } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";
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
    <Alert
      tone="error"
      action={
        <a
          href={`#${targetId}`}
          onClick={goToPending}
          className={cn(textLinkClassName(), "shrink-0 gap-1.5 self-start px-2 sm:self-auto")}
        >
          Ver pendências
          <ArrowDown className="h-4 w-4 text-accent" aria-hidden="true" />
        </a>
      }
    >
      <p>
        <span className="font-semibold text-error">
          {count} {count === 1 ? "pendência vencida" : "pendências vencidas"}
        </span>
        <span className="break-words text-text-secondary">
          {" · "}
          {critical.map((alert) => alert.title ?? "Sem título").join(" · ")}
        </span>
      </p>
    </Alert>
  );
}
