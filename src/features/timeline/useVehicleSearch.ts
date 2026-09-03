import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type VehicleSearchResult =
  Database["public"]["Functions"]["search_vehicle"]["Returns"][number];

async function fetchVehicleSearch(vehicleId: string, query: string): Promise<VehicleSearchResult[]> {
  const { data, error } = await supabase.rpc("search_vehicle", {
    p_vehicle_id: vehicleId,
    p_query: query,
  });
  if (error) throw error;
  return data;
}

/** Só roda com termo não vazio — `search_vehicle` já vem ordenado por `rank desc`, não reordena. */
export function useVehicleSearch(vehicleId: string, query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["vehicles", vehicleId, "search", trimmed],
    queryFn: () => fetchVehicleSearch(vehicleId, trimmed),
    enabled: trimmed.length > 0,
  });
}
