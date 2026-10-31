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
import type { TimelineEventRow } from "./useTimeline";
import { EditNoteDialog } from "./EditNoteDialog";
import { DeleteNoteDialog } from "./DeleteNoteDialog";

type TimelineItemProps = {
  vehicleId: string;
  event: TimelineEventRow;
  /**
   * Etapa 04: `row` é a linha compacta da "Atividade recente" do dashboard —
   * sem caixa própria (a lista já mora num painel com divisores), título um
   * passo menor e "Ver" com alvo de 44px e nome completo pro leitor de tela.
   * O conteúdo e as ações são os mesmos do `card` da tela de Histórico.
   */
  variant?: "card" | "row";
};

export function TimelineItem({ vehicleId, event, variant = "card" }: TimelineItemProps) {
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
  const targetHref = resolveTimelineLink(vehicleId, event);
  const isRow = variant === "row";

  return (
    <div
      className={
        isRow
          ? "flex items-start gap-3 px-4 py-3"
          : "flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
      }
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className={isRow ? "text-sm font-medium break-words text-text-primary" : "font-medium text-text-primary"}>
            {event.title ?? "Sem título"}
          </p>
          {/* Na linha compacta, abastecimento já se chama "Abastecimento" na view — não repete o tipo. */}
          {!(isRow && event.title === typeLabel) && <span className="text-xs text-text-secondary">{typeLabel}</span>}
        </div>
        <p className="text-xs text-text-secondary">
          {event.occurred_on ? formatDateOnly(event.occurred_on) : "—"}
          {event.odometer_km != null ? ` · ${formatKm(event.odometer_km)}` : ""}
        </p>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{event.description}</p>
        )}
      </div>

      <div className={isRow ? "-my-2.5 flex shrink-0 items-center gap-1" : "flex shrink-0 flex-col items-end gap-2"}>
        {event.amount != null && (
          <span className={isRow ? "text-sm font-medium whitespace-nowrap text-text-primary" : "font-medium text-text-primary"}>
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
              className={
                isRow
                  ? "-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-2 text-xs text-accent underline"
                  : "inline-flex items-center gap-1 text-xs text-accent underline"
              }
            >
              Ver
              {isRow && <span className="sr-only"> {event.title ?? "registro"} ({typeLabel})</span>}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          )
        )}
      </div>

      {isNote && event.source_id && (
        <>
          <EditNoteDialog
            vehicleId={vehicleId}
            note={{
              id: event.source_id,
              title: event.title ?? "",
              body: event.description,
              occurred_on: event.occurred_on ?? "",
              odometer_km: event.odometer_km,
            }}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteNoteDialog
            vehicleId={vehicleId}
            note={{
              id: event.source_id,
              title: event.title ?? "",
              body: event.description,
              occurred_on: event.occurred_on ?? "",
              odometer_km: event.odometer_km,
            }}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </div>
  );
}
