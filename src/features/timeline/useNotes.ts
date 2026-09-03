import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];

/** O que os diálogos de editar/excluir nota realmente precisam — permite montar a partir de `vehicle_timeline` (sem `created_at`/`updated_at`) ou de `NoteRow` direto. */
export type NoteLike = Pick<NoteRow, "id" | "title" | "body" | "occurred_on" | "odometer_km">;

/** Toda mutação invalida por prefixo `['vehicles']` — cobre a timeline (que embute `vehicle_id`) e o dashboard. */
function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateNote(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<NoteInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("notes")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateNote(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: NoteUpdate & { id: string }) => {
      const { error } = await supabase
        .from("notes")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useDeleteNote(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
