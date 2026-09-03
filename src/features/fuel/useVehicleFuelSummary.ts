import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/** Médio/melhor/pior km/L + total de litros — sempre lido pronto de `vehicle_fuel_summary` (RN-1). */
async function fetchVehicleFuelSummary(vehicleId: string) {
  const { data, error } = await supabase
    .from("vehicle_fuel_summary")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useVehicleFuelSummary(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "fuel-summary"],
    queryFn: () => fetchVehicleFuelSummary(vehicleId),
  });
}
