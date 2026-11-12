import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import {
  isKnownEventType,
  TIMELINE_EVENT_TYPE_FALLBACK_ICON,
  TIMELINE_EVENT_TYPE_ICONS,
  TIMELINE_EVENT_TYPE_LABELS,
} from "./schemas";
import { resolveTimelineLink } from "./timelineLinks";
import { noteFromEvent } from "./timelinePresentation";
import type { TimelineEventRow } from "./useTimeline";
import { EditNoteDialog } from "./EditNoteDialog";
import { DeleteNoteDialog } from "./DeleteNoteDialog";

type TimelineItemProps = {
  vehicleId: string;
  event: TimelineEventRow;
};

/**
 * Etapa 04: a linha compacta da "Atividade recente" do dashboard — sem caixa
 * própria (a lista já mora num painel com divisores), título um passo menor
 * e "Ver" com alvo de 44px e nome completo pro leitor de tela.
 *
 * Etapa 15: o cartão (`variant="card"`) saiu — o único consumidor era a
 * "Atividade" do cabeçalho, que agora monta a linha dela
 * (`HeaderActivityMenu`). A linha do dashboard não mudou.
 */
export function TimelineItem({ vehicleId, event }: TimelineItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const eventType = event.event_type;
  const Icon = isKnownEventType(eventType)
    ? TIMELINE_EVENT_TYPE_ICONS[eventType]
    : TIMELINE_EVENT_TYPE_FALLBACK_ICON;
  const typeLabel = isKnownEventType(eventType)
    ? TIMELINE_EVENT_TYPE_LABELS[eventType]
    : (event.source_table ?? eventType ?? "Evento");
  const isNote = event.event_type === "note";
  // Etapa 13: a mesma nota (título nulo continua nulo) que o Histórico passa aos diálogos.
  const note = noteFromEvent(event);
  const targetHref = resolveTimelineLink(vehicleId, event);

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-sm font-medium break-words text-text-primary">{event.title ?? "Sem título"}</p>
          {/* Abastecimento já se chama "Abastecimento" na view — não repete o tipo. */}
          {event.title !== typeLabel && <span className="text-xs text-text-secondary">{typeLabel}</span>}
        </div>
        <p className="text-xs text-text-secondary">
          {event.occurred_on ? formatDateOnly(event.occurred_on) : "—"}
          {event.odometer_km != null ? ` · ${formatKm(event.odometer_km)}` : ""}
        </p>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{event.description}</p>
        )}
      </div>

      <div className="-my-2.5 flex shrink-0 items-center gap-1">
        {event.amount != null && (
          <span className="text-sm font-medium whitespace-nowrap text-text-primary">
            {formatMoney(event.amount)}
          </span>
        )}
        {isNote ? (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar nota"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir nota"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          targetHref && (
            <Link
              to={targetHref}
              className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-2 text-xs text-accent underline"
            >
              Ver
              <span className="sr-only"> {event.title ?? "registro"} ({typeLabel})</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          )
        )}
      </div>

      {note && (
        <>
          <EditNoteDialog vehicleId={vehicleId} note={note} open={editOpen} onOpenChange={setEditOpen} />
          <DeleteNoteDialog vehicleId={vehicleId} note={note} open={deleteOpen} onOpenChange={setDeleteOpen} />
        </>
      )}
    </div>
  );
}
