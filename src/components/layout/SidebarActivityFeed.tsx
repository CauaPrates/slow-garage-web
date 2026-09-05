import { Link } from "react-router-dom";
import { formatDateOnly, formatMoney } from "@/lib/format";
import {
  isKnownEventType,
  TIMELINE_EVENT_TYPE_FALLBACK_ICON,
  TIMELINE_EVENT_TYPE_ICONS,
} from "@/features/timeline/schemas";
import { resolveTimelineLink } from "@/features/timeline/timelineLinks";
import {
  useGarageTimeline,
  type GarageTimelineEvent,
} from "@/features/vehicle/useGarageTimeline";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";

type SidebarActivityFeedProps = {
  vehicles: VehicleWithSummary[];
};

const ROW_CLASSNAME =
  "flex items-start gap-2 rounded-md px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-bg";

function ActivityRow({
  vehicleId,
  event,
}: {
  vehicleId: string;
  event: GarageTimelineEvent;
}) {
  const eventType = event.event_type;
  const Icon = isKnownEventType(eventType)
    ? TIMELINE_EVENT_TYPE_ICONS[eventType]
    : TIMELINE_EVENT_TYPE_FALLBACK_ICON;
  const href = resolveTimelineLink(vehicleId, event);

  const content = (
    <>
      <Icon
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-secondary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-text-primary">
          {event.title ?? "Sem título"}
        </p>
        <p className="truncate text-text-secondary">
          {event.occurred_on ? formatDateOnly(event.occurred_on) : "—"}
          {event.amount != null ? ` · ${formatMoney(event.amount)}` : ""}
        </p>
      </div>
    </>
  );

  return href ? (
    <Link to={href} className={ROW_CLASSNAME}>
      {content}
    </Link>
  ) : (
    <div className={ROW_CLASSNAME}>{content}</div>
  );
}

/**
 * Fase 15b: o usuário pediu pra ler a atividade recente direto pela nav
 * bar no desktop — não atrás de um clique num ícone (isso é o que
 * `HeaderActivityMenu` fazia, mas ele só continua existindo pro mobile,
 * onde não há sidebar). Preenche o espaço vazio que sobrava entre os
 * links de navegação e "Configurações" fixo no rodapé. Mesma fonte de
 * dado e limite de 8 eventos que o resto da garagem já usa
 * (`useGarageTimeline`) — itens compactos (ícone + título + data/valor)
 * porque a coluna tem 224px (`w-56`), não a largura de um card de
 * timeline normal.
 */
export function SidebarActivityFeed({ vehicles }: SidebarActivityFeedProps) {
  const feedQuery = useGarageTimeline(vehicles.map((v) => v.id));
  const vehicleLabelById = new Map(
    vehicles.map((v) => [v.id, `${v.make} ${v.model}`]),
  );
  const showVehicleLabel = vehicles.length > 1;

  if (vehicles.length === 0) return null;

  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1 border-t border-border pt-2">
      <p className="px-3 pb-1 text-xs font-medium tracking-wide text-text-secondary uppercase">
        Atividade recente
      </p>

      <div className="flex flex-col gap-0.5 overflow-y-auto">
        {feedQuery.isLoading && (
          <div className="flex flex-col gap-1 px-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-md bg-bg" />
            ))}
          </div>
        )}

        {feedQuery.isError && (
          <p className="px-3 text-xs text-text-secondary">
            Não foi possível carregar.
          </p>
        )}

        {feedQuery.data && feedQuery.data.length === 0 && (
          <p className="px-3 text-xs text-text-secondary">
            Nenhuma atividade ainda.
          </p>
        )}

        {feedQuery.data?.map((event) => (
          <div key={`${event.source_table}-${event.source_id}`}>
            {showVehicleLabel && (
              <p className="px-3 pt-1 text-[10px] font-medium tracking-wide text-text-secondary/70 uppercase">
                {vehicleLabelById.get(event.vehicle_id) ?? ""}
              </p>
            )}
            <ActivityRow vehicleId={event.vehicle_id} event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}
