import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { deleteAttachmentIfExists, fetchAttachmentsByEntity } from "@/features/attachment/useAttachment";
import type { Database } from "@/types/database.types";
import type { AttachmentRow } from "@/features/attachment/useAttachment";

type MaintenanceRecordRowBase = Database["public"]["Tables"]["maintenance_records"]["Row"];
type MaintenanceRecordInsert = Database["public"]["Tables"]["maintenance_records"]["Insert"];
type MaintenanceRecordUpdate = Database["public"]["Tables"]["maintenance_records"]["Update"];

export type MaintenanceRecordRow = MaintenanceRecordRowBase & {
  attachment: AttachmentRow | null;
};

async function fetchMaintenanceRecords(vehicleId: string): Promise<MaintenanceRecordRow[]> {
  const { data: records, error } = await supabase
    .from("maintenance_records")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!records.length) return [];

  const attachmentByRecordId = await fetchAttachmentsByEntity(
    "maintenance_record",
    records.map((r) => r.id),
  );

  return records.map((record) => ({
    ...record,
    attachment: attachmentByRecordId.get(record.id) ?? null,
  }));
}

export function useMaintenanceRecords(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "maintenance-records"],
    queryFn: () => fetchMaintenanceRecords(vehicleId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

/** RN-2: nunca envia/atualiza `maintenance_items.last_service_*` nem `vehicles.current_odometer_km` — um trigger do banco já faz isso. */
export function useCreateMaintenanceRecord(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<MaintenanceRecordInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateMaintenanceRecord(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: MaintenanceRecordUpdate & { id: string }) => {
      const { error } = await supabase
        .from("maintenance_records")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/** RN-4: apaga o anexo antes da execução, mesma regra de Gasto (Fase 4/ADR-027). */
export function useDeleteMaintenanceRecord(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteAttachmentIfExists("maintenance_record", id);

      const { error } = await supabase
        .from("maintenance_records")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
