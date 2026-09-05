import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type VehicleAlertRow = Database["public"]["Views"]["vehicle_alerts"]["Row"];
export type GarageAlert = VehicleAlertRow & { vehicle_id: string };

/**
 * Mesmo padrão do ADR-051/ADR-053 (`useGarageSummary`/`useGarageTimeline`):
 * não existe RPC de garagem inteira, busca a view por veículo
 * (`vehicle_alerts`, já filtrada por `is_active`/severidade — RN-5 de
 * `useVehicleAlerts.ts`) com `vehicle_id IN (...)`. `vehicle_id` vem
 * `string | null` no tipo gerado da view — filtra fora (nunca é nulo na
 * prática, FK obrigatória) em vez de forçar com `!`.
 */
async function fetchGarageAlerts(vehicleIds: string[]): Promise<GarageAlert[]> {
  if (vehicleIds.length === 0) return [];

  const { data, error } = await supabase
    .from("vehicle_alerts")
    .select("*")
    .in("vehicle_id", vehicleIds)
    .order("severity", { ascending: false });
  if (error) throw error;
  return (data ?? []).filter((alert): alert is GarageAlert => alert.vehicle_id != null);
}

export function useGarageAlerts(vehicleIds: string[]) {
  return useQuery({
    queryKey: ["vehicles", "garage-alerts", ...[...vehicleIds].sort()],
    queryFn: () => fetchGarageAlerts(vehicleIds),
    enabled: vehicleIds.length > 0,
  });
}
