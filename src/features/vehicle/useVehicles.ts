import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { Database } from "@/types/database.types";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
type VehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];
type FinancialSummary =
  Database["public"]["Views"]["vehicle_financial_summary"]["Row"];

export type VehicleWithSummary = VehicleRow & {
  financialSummary: FinancialSummary | null;
  photoUrl: string | null;
};

const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60;

async function fetchVehicles(): Promise<VehicleWithSummary[]> {
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!vehicles.length) return [];

  const vehicleIds = vehicles.map((v) => v.id);
  const { data: summaries, error: summaryError } = await supabase
    .from("vehicle_financial_summary")
    .select("*")
    .in("vehicle_id", vehicleIds);
  if (summaryError) throw summaryError;
  const summaryByVehicleId = new Map(
    (summaries ?? []).map((s) => [s.vehicle_id, s]),
  );

  const photoIds = vehicles
    .map((v) => v.primary_photo_id)
    .filter((id): id is string => Boolean(id));

  let signedUrlByPhotoId = new Map<string, string>();
  if (photoIds.length) {
    const { data: photos, error: photosError } = await supabase
      .from("vehicle_photos")
      .select("id, storage_path")
      .in("id", photoIds);
    if (photosError) throw photosError;

    const paths = (photos ?? []).map((p) => p.storage_path);
    if (paths.length) {
      const { data: signedUrls, error: signError } = await supabase.storage
        .from("vehicle-photos")
        .createSignedUrls(paths, PHOTO_SIGNED_URL_TTL_SECONDS);
      if (signError) throw signError;

      const signedUrlByPath = new Map(
        (signedUrls ?? [])
          .filter((s) => s.signedUrl)
          .map((s) => [s.path, s.signedUrl as string]),
      );
      signedUrlByPhotoId = new Map(
        (photos ?? [])
          .map((p): [string, string | undefined] => [
            p.id,
            signedUrlByPath.get(p.storage_path),
          ])
          .filter((entry): entry is [string, string] => Boolean(entry[1])),
      );
    }
  }

  return vehicles.map((vehicle) => ({
    ...vehicle,
    financialSummary: summaryByVehicleId.get(vehicle.id) ?? null,
    photoUrl: vehicle.primary_photo_id
      ? (signedUrlByPhotoId.get(vehicle.primary_photo_id) ?? null)
      : null,
  }));
}

export function useVehicles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["vehicles", user?.id],
    queryFn: fetchVehicles,
    enabled: !!user,
  });
}

/**
 * Deriva um veículo específico do cache de `useVehicles` — sem query nova.
 * RLS já garante que a lista só contém veículos do usuário logado, então
 * "não está na lista" cobre tanto "não existe" quanto "é de outro usuário"
 * (RN-4 de specs/003-vehicle-shell/spec.md).
 */
export function useVehicle(vehicleId: string) {
  const query = useVehicles();
  const vehicle = query.data?.find((v) => v.id === vehicleId) ?? null;
  return { ...query, vehicle };
}

export function useCreateVehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<VehicleInsert, "user_id">) => {
      if (!user) throw new Error("Sem usuário autenticado.");
      const { data, error } = await supabase
        .from("vehicles")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles", user?.id] });
    },
  });
}

export function useUpdateVehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: VehicleUpdate & { id: string }) => {
      const { error } = await supabase
        .from("vehicles")
        .update(input)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles", user?.id] });
    },
  });
}

export function useDeleteVehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles", user?.id] });
    },
  });
}
