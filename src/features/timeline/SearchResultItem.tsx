import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/format";
import {
  SOURCE_TABLE_TO_EVENT_TYPE,
  TIMELINE_EVENT_TYPE_FALLBACK_ICON,
  TIMELINE_EVENT_TYPE_ICONS,
  TIMELINE_EVENT_TYPE_LABELS,
} from "./schemas";
import { resolveTimelineLink } from "./timelineLinks";
import type { VehicleSearchResult } from "./useVehicleSearch";
import { EditNoteDialog } from "./EditNoteDialog";

type SearchResultItemProps = {
  vehicleId: string;
  result: VehicleSearchResult;
};

export function SearchResultItem({ vehicleId, result }: SearchResultItemProps) {
  const [editOpen, setEditOpen] = useState(false);

  const eventType = SOURCE_TABLE_TO_EVENT_TYPE[result.source_table];
  const Icon = eventType ? TIMELINE_EVENT_TYPE_ICONS[eventType] : TIMELINE_EVENT_TYPE_FALLBACK_ICON;
  const typeLabel = eventType ? TIMELINE_EVENT_TYPE_LABELS[eventType] : result.source_table;
  const isNote = eventType === "note";
  const targetHref = eventType ? resolveTimelineLink(vehicleId, { event_type: eventType }) : null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="font-medium text-text-primary">{result.title}</p>
          <span className="text-xs text-text-secondary">{typeLabel}</span>
        </div>
        <p className="text-xs text-text-secondary">{formatDateOnly(result.occurred_on)}</p>
        {result.snippet && (
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{result.snippet}</p>
        )}
      </div>

      <div className="flex shrink-0 items-start">
        {isNote ? (
          <Button variant="ghost" size="icon" aria-label="Editar nota" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          targetHref && (
            <Link
              to={targetHref}
              className="inline-flex items-center gap-1 text-xs text-accent underline"
            >
              Ver <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          )
        )}
      </div>

      {isNote && (
        <EditNoteDialog
          vehicleId={vehicleId}
          note={{
            id: result.source_id,
            title: result.title,
            body: result.snippet,
            occurred_on: result.occurred_on,
            odometer_km: null,
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
