import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { TimelineItem } from "@/features/timeline/TimelineItem";
import type { TimelineEventRow } from "@/features/timeline/useTimeline";
import { Panel, PANEL_LINK_CLASSNAME } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";

type RecentActivityPanelProps = {
  vehicleId: string;
  query:
    | { status: "loading" }
    | { status: "error"; onRetry: () => void }
    | { status: "ready"; events: TimelineEventRow[] };
};

const RECENT_TIMELINE_LIMIT = 5;

/**
 * Etapa 04: os 5 eventos mais recentes de `vehicle_timeline` (mesma consulta
 * da tela de Histórico), em linhas compactas do próprio `TimelineItem` — tipo
 * por extenso, data, km e valor quando existem, "Ver" pra tela de origem e,
 * só em nota, editar/excluir como antes. Carrega e falha sozinho: erro aqui
 * não derruba o resto do painel.
 */
export function RecentActivityPanel({ vehicleId, query }: RecentActivityPanelProps) {
  return (
    <Panel
      title="Atividade recente"
      description="Os 5 registros mais recentes."
      action={
        <Link to={ROUTES.vehicleTimeline(vehicleId)} className={PANEL_LINK_CLASSNAME}>
          Ver histórico<span className="sr-only"> completo</span>
          <span aria-hidden="true" className="text-accent">
            →
          </span>
        </Link>
      }
    >
      {query.status === "loading" && (
        <div className="flex flex-col gap-2 p-4" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-md bg-state-hover" />
          ))}
        </div>
      )}

      {query.status === "error" && (
        <div className="flex flex-col items-start gap-2 p-4">
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            Não foi possível carregar o histórico recente.
          </p>
          <Button variant="outline" onClick={query.onRetry}>
            Tentar de novo
          </Button>
        </div>
      )}

      {query.status === "ready" && query.events.length === 0 && (
        <p className="px-4 py-4 text-sm text-text-secondary">
          Nenhum registro ainda. Use os atalhos acima para registrar o primeiro abastecimento, gasto ou manutenção.
        </p>
      )}

      {query.status === "ready" && query.events.length > 0 && (
        <ul className="divide-y divide-border">
          {query.events.slice(0, RECENT_TIMELINE_LIMIT).map((event) => (
            <li key={`${event.source_table}-${event.source_id}`}>
              <TimelineItem vehicleId={vehicleId} event={event} variant="row" />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
