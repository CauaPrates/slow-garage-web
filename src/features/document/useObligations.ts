import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type ObligationRow = Database["public"]["Tables"]["obligations"]["Row"];
type ObligationInsert = Database["public"]["Tables"]["obligations"]["Insert"];
type ObligationUpdate = Database["public"]["Tables"]["obligations"]["Update"];

async function fetchObligations(vehicleId: string): Promise<ObligationRow[]> {
  const { data, error } = await supabase
    .from("obligations")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("due_on", { ascending: true });
  if (error) throw error;
  return data;
}

export function useObligations(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "obligations"],
    queryFn: () => fetchObligations(vehicleId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateObligation(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<ObligationInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("obligations")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateObligation(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: ObligationUpdate & { id: string }) => {
      const { error } = await supabase
        .from("obligations")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useDeleteObligation(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("obligations")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/** RN-3: marcar como paga é o único jeito de silenciar o alerta correspondente — não existe "dispensar" separado de pagar. */
export function useMarkObligationPaid(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, paidOn }: { id: string; paidOn: string }) => {
      const { error } = await supabase
        .from("obligations")
        .update({ paid_on: paidOn })
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
