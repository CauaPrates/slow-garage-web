import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type MaintenanceItemRow = Database["public"]["Tables"]["maintenance_items"]["Row"];
type MaintenanceItemInsert = Database["public"]["Tables"]["maintenance_items"]["Insert"];
type MaintenanceItemUpdate = Database["public"]["Tables"]["maintenance_items"]["Update"];
type MaintenanceStatusRow = Database["public"]["Views"]["maintenance_status"]["Row"];

export type MaintenanceItemWithStatus = MaintenanceItemRow & {
  status: MaintenanceStatusRow | null;
};

/** Combina `maintenance_items` (CRUD) com `maintenance_status` (situação, view) — mesmo padrão de batelamento de `useVehicles`. */
async function fetchMaintenanceItems(vehicleId: string): Promise<MaintenanceItemWithStatus[]> {
  const { data: items, error } = await supabase
    .from("maintenance_items")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("name");
  if (error) throw error;
  if (!items.length) return [];

  const { data: statuses, error: statusError } = await supabase
    .from("maintenance_status")
    .select("*")
    .eq("vehicle_id", vehicleId);
  if (statusError) throw statusError;

  const statusByItemId = new Map((statuses ?? []).map((s) => [s.maintenance_item_id, s]));

  return items.map((item) => ({
    ...item,
    status: statusByItemId.get(item.id) ?? null,
  }));
}

export function useMaintenanceItems(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "maintenance-items"],
    queryFn: () => fetchMaintenanceItems(vehicleId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateMaintenanceItem(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<MaintenanceItemInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("maintenance_items")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateMaintenanceItem(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: MaintenanceItemUpdate & { id: string }) => {
      const { error } = await supabase
        .from("maintenance_items")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useDeleteMaintenanceItem(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("maintenance_items")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
