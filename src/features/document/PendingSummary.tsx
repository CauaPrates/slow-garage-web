import { useId, useState } from "react";
import { AlertCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { AlertBanner } from "@/features/maintenance/AlertBanner";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type VehicleAlert = Database["public"]["Views"]["vehicle_alerts"]["Row"];

const TITLE_ID = "documents-alerts-title";
const DESCRIPTION = "Vencidos e a vencer em até 30 dias — os mesmos do dashboard, da Manutenção e do sino.";

const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;

/** Botão de expansão: o mesmo desenho do `PanelDisclosure` (alvo de 44px, seta que gira). */
const TOGGLE_CLASSNAME =
  "flex min-h-control w-full items-center gap-2 px-(--panel-pad-x) py-2 text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover";

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      aria-hidden="true"
      className={cn(
        "h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-(--duration-fast)",
        open && "rotate-180",
      )}
    />
  );
}

/**
 * Etapa 11 — as pendências de documento e obrigação (`vehicle_alerts`),
 * sempre começando recolhidas, com a lista de antes (o mesmo `AlertBanner`)
 * dentro.
 *
 * Ajuste da revisão: abaixo de `sm` o bloco inteiro é **um botão** — "6
 * pendências · 2 vencidas" — e a explicação e a contagem por aba ficam dentro;
 * recolhido, ele ocupa uma linha de 44px e a lista de documentos aparece na
 * primeira tela em 320px. A partir de `sm`, cabeçalho com a contagem por aba
 * e "Ver a lista", como antes. Os dois botões abrem a mesma região (cada um só
 * existe na sua largura).
 */
export function PendingSummary({ alerts }: { alerts: VehicleAlert[] }) {
  const regionId = useId();
  const [open, setOpen] = useState(false);

  const overdue = alerts.filter((alert) => alert.severity === "critical").length;
  const count = (table: string, severity: "critical" | "warning") =>
    alerts.filter((alert) => alert.source_table === table && alert.severity === severity).length;
  const describe = (label: string, table: string, late: [string, string], soon: [string, string]) => {
    const parts = [
      count(table, "critical") > 0 && plural(count(table, "critical"), ...late),
      count(table, "warning") > 0 && plural(count(table, "warning"), ...soon),
    ].filter(Boolean);
    return parts.length ? `${label}: ${parts.join(", ")}` : null;
  };
  const byTab = [
    describe("Documentos", "documents", ["vencido", "vencidos"], ["a vencer", "a vencer"]),
    describe("Obrigações", "obligations", ["vencida", "vencidas"], ["próxima", "próximas"]),
  ].filter((line): line is string => !!line);
  const compact = `${plural(alerts.length, "pendência", "pendências")} · ${
    overdue > 0 ? plural(overdue, "vencida", "vencidas") : "nenhuma vencida"
  }`;
  const Icon = overdue > 0 ? AlertCircle : AlertTriangle;

  return (
    <section
      aria-labelledby={TITLE_ID}
      className={cn(PANEL_CLASSNAME, "border-l-2", overdue > 0 ? "border-l-error" : "border-l-warning")}
    >
      {/* Celular: o bloco é o botão. */}
      <h2 className="sm:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen(!open)}
          className={TOGGLE_CLASSNAME}
        >
          <Icon className={cn("h-4 w-4 shrink-0", overdue > 0 ? "text-error" : "text-warning")} aria-hidden="true" />
          <span className="min-w-0 flex-1">{compact}</span>
          <Chevron open={open} />
        </button>
      </h2>

      {/* A partir de `sm`: cabeçalho com a contagem por aba e "Ver a lista". */}
      <div className="hidden sm:block">
        <PanelHeader
          titleId={TITLE_ID}
          title="Pendências"
          description={DESCRIPTION}
          action={<PanelCount>{byTab.join(" · ")}</PanelCount>}
          className="border-b-0"
        />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen(!open)}
          className={cn(TOGGLE_CLASSNAME, "justify-between border-t border-border")}
        >
          <span>
            Ver a lista
            <span className="font-normal text-text-secondary"> — {plural(alerts.length, "item", "itens")}</span>
          </span>
          <Chevron open={open} />
        </button>
      </div>

      <div id={regionId} hidden={!open}>
        <div className="flex flex-col gap-1 border-t border-border px-(--panel-pad-x) py-3 sm:hidden">
          <p className="type-caption text-text-secondary">{DESCRIPTION}</p>
          {byTab.map((line) => (
            <p key={line} className="text-sm text-text-primary">
              {line}
            </p>
          ))}
        </div>
        <div className="px-3 pb-3">
          <AlertBanner alerts={alerts} />
        </div>
      </div>
    </section>
  );
}
