import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type IssueRow = Database["public"]["Tables"]["issues"]["Row"];
type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"];
type IssueUpdate = Database["public"]["Tables"]["issues"]["Update"];

async function fetchIssues(vehicleId: string): Promise<IssueRow[]> {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("reported_on", { ascending: false });
  if (error) throw error;
  return data;
}

export function useIssues(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "issues"],
    queryFn: () => fetchIssues(vehicleId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateIssue(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<IssueInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("issues")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateIssue(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: IssueUpdate & { id: string }) => {
      const { error } = await supabase
        .from("issues")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useDeleteIssue(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("issues")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
