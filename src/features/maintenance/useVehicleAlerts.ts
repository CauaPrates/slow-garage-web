import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/** RN-5: `vehicle_alerts` já vem filtrada (`is_active = true`, só `overdue`/`due_soon`) — não filtra de novo. */
async function fetchVehicleAlerts(vehicleId: string) {
  const { data, error } = await supabase
    .from("vehicle_alerts")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("severity", { ascending: false });
  if (error) throw error;
  return data;
}

export function useVehicleAlerts(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "alerts"],
    queryFn: () => fetchVehicleAlerts(vehicleId),
  });
}
