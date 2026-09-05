import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type MaintenanceStatusRow =
  Database["public"]["Views"]["maintenance_status"]["Row"];

export type GarageMaintenanceDue = MaintenanceStatusRow & {
  vehicle_id: string;
  next_service_date: string;
};

/**
 * Fase 15d: mesma família de `useGarageAlerts`/`useGarageTimeline` (ADR-051/053)
 * — não existe RPC de garagem inteira, então busca a view por veículo
 * (`maintenance_status`) com `vehicle_id IN (...)`. Só item ativo e com data
 * prevista entra; a ordenação por `next_service_date` é do próprio banco, e o
 * `limit` é generoso de propósito (não `1`): o painel usa o primeiro, mas o
 * cache serve pra qualquer leitura de "o que vem primeiro" sem nova query.
 * Item vencido tem data no passado e por isso vem na frente — é o mais urgente,
 * não um erro de ordenação.
 */
async function fetchGarageMaintenance(
  vehicleIds: string[],
): Promise<GarageMaintenanceDue[]> {
  if (vehicleIds.length === 0) return [];

  const { data, error } = await supabase
    .from("maintenance_status")
    .select("*")
    .in("vehicle_id", vehicleIds)
    .eq("is_active", true)
    .not("next_service_date", "is", null)
    .order("next_service_date", { ascending: true })
    .limit(20);
  if (error) throw error;

  return (data ?? []).filter(
    (row): row is GarageMaintenanceDue =>
      row.vehicle_id != null && row.next_service_date != null,
  );
}

/** Prefixo `["vehicles", ...]` de propósito — reaproveita a invalidação que toda mutação de manutenção já dispara (`useInvalidateVehicles`). */
export function useGarageMaintenance(vehicleIds: string[]) {
  return useQuery({
    queryKey: ["vehicles", "garage-maintenance", ...[...vehicleIds].sort()],
    queryFn: () => fetchGarageMaintenance(vehicleIds),
    enabled: vehicleIds.length > 0,
  });
}
