import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type FuelLogMetric = Database["public"]["Views"]["fuel_log_metrics"]["Row"];
type FuelLogInsert = Database["public"]["Tables"]["fuel_logs"]["Insert"];
type FuelLogUpdate = Database["public"]["Tables"]["fuel_logs"]["Update"];

/**
 * Lê de `fuel_log_metrics` (view), não da tabela — já vem com km/L e
 * custo/km por registro (RN-1: nunca calculado no cliente). Criar/editar/
 * excluir escrevem em `fuel_logs` (a view é somente leitura).
 */
async function fetchFuelLogs(vehicleId: string): Promise<FuelLogMetric[]> {
  const { data, error } = await supabase
    .from("fuel_log_metrics")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("occurred_on", { ascending: false })
    .order("odometer_km", { ascending: false });
  if (error) throw error;
  return data;
}

export function useFuelLogs(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "fuel-logs"],
    queryFn: () => fetchFuelLogs(vehicleId),
  });
}

/** Toda mutação invalida por prefixo `['vehicles']` — cobre a lista, o resumo de consumo e o total financeiro do header. */
function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateFuelLog(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<FuelLogInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateFuelLog(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: FuelLogUpdate & { id: string }) => {
      const { error } = await supabase
        .from("fuel_logs")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useDeleteFuelLog(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fuel_logs")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
