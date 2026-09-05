import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { VehicleDashboard } from "./types";

async function fetchVehicleDashboard(vehicleId: string): Promise<VehicleDashboard> {
  const { data, error } = await supabase.rpc("get_vehicle_dashboard", {
    p_vehicle_id: vehicleId,
  });
  if (error) throw error;
  return data as unknown as VehicleDashboard;
}

/** RN-1: uma chamada só — nunca decompor em query de tabela por bloco. */
export function useVehicleDashboard(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "dashboard"],
    queryFn: () => fetchVehicleDashboard(vehicleId),
  });
}
