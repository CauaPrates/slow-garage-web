import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TimelineEventRow } from "@/features/timeline/useTimeline";

const GARAGE_TIMELINE_LIMIT = 8;

/** `vehicle_id` vem `string | null` no tipo gerado da view (toda coluna de view é opcional pro Supabase) — na prática nunca é nulo (FK obrigatória em `vehicles`), mas o filtro abaixo deixa isso explícito pro TypeScript em vez de um `!` forçado. */
export type GarageTimelineEvent = TimelineEventRow & { vehicle_id: string };

/**
 * Mesmo padrão do ADR-051 (`useGarageSummary`): não existe RPC de garagem
 * inteira, então busca a view por veículo (`vehicle_timeline`) filtrando
 * `vehicle_id IN (...)`. Diferente de `useGarageSummary`, não soma nada —
 * só ordena por data e corta em N, então o próprio banco já entrega o
 * resultado pronto (`order` + `limit` na query), sem merge no cliente.
 */
async function fetchGarageTimeline(vehicleIds: string[]): Promise<GarageTimelineEvent[]> {
  if (vehicleIds.length === 0) return [];

  const { data, error } = await supabase
    .from("vehicle_timeline")
    .select("*")
    .in("vehicle_id", vehicleIds)
    .order("occurred_on", { ascending: false })
    .limit(GARAGE_TIMELINE_LIMIT);
  if (error) throw error;
  return (data ?? []).filter((event): event is GarageTimelineEvent => event.vehicle_id != null);
}

/** Prefixo `["vehicles", ...]` de propósito — reaproveita a invalidação já disparada por toda mutação de gasto/abastecimento/manutenção (`useInvalidateVehicles`), sem precisar adicionar uma chave nova em cada hook de mutação. */
export function useGarageTimeline(vehicleIds: string[]) {
  return useQuery({
    queryKey: ["vehicles", "garage-timeline", ...[...vehicleIds].sort()],
    queryFn: () => fetchGarageTimeline(vehicleIds),
    enabled: vehicleIds.length > 0,
  });
}
