import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { periodRange, type Period } from "@/lib/period";
import type { Database } from "@/types/database.types";

export type TimelineEventRow = Database["public"]["Views"]["vehicle_timeline"]["Row"];

async function fetchTimeline(vehicleId: string): Promise<TimelineEventRow[]> {
  const { data, error } = await supabase
    .from("vehicle_timeline")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("occurred_on", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Busca a timeline inteira do veículo uma vez só — a view é pequena por
 * veículo (um punhado de eventos, não milhares), então filtrar tipo/
 * período no cliente evita um round-trip a cada troca de filtro.
 */
export function useTimeline(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "timeline"],
    queryFn: () => fetchTimeline(vehicleId),
  });
}

export type TimelineTypeFilter = "all" | string;

export function filterTimelineEvents(
  events: TimelineEventRow[],
  filters: { type: TimelineTypeFilter; period: Period },
): TimelineEventRow[] {
  const range = periodRange(filters.period);
  return events.filter((event) => {
    if (filters.type !== "all" && event.event_type !== filters.type) return false;
    if (!event.occurred_on) return false;
    if (range.gte && event.occurred_on < range.gte) return false;
    if (range.lte && event.occurred_on > range.lte) return false;
    return true;
  });
}
