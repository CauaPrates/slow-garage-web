import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type FinancingRow = Database["public"]["Tables"]["financings"]["Row"];
type FinancingInsert = Database["public"]["Tables"]["financings"]["Insert"];
type FinancingUpdate = Database["public"]["Tables"]["financings"]["Update"];

/** RN-2: no máximo um financiamento por veículo (`financings.vehicle_id` é único) — sempre 0 ou 1 linha. */
async function fetchFinancing(vehicleId: string): Promise<FinancingRow | null> {
  const { data, error } = await supabase
    .from("financings")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useFinancing(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "financing"],
    queryFn: () => fetchFinancing(vehicleId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateFinancing(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<FinancingInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("financings")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/** RN-1: `installments_remaining`/`outstanding_balance` nunca fazem parte do input — são colunas geradas. */
export function useUpdateFinancing(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: FinancingUpdate & { id: string }) => {
      const { error } = await supabase
        .from("financings")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useDeleteFinancing(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financings")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/** AC-13: soma 1 em `installments_paid` — nunca chama de novo se já está no total (botão fica desabilitado nesse caso). */
export function useAddPaidInstallment(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (financing: FinancingRow) => {
      const { error } = await supabase
        .from("financings")
        .update({ installments_paid: financing.installments_paid + 1 })
        .eq("id", financing.id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
