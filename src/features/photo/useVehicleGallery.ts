import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { fileExtension } from "@/lib/fileExtension";
import type { Database } from "@/types/database.types";

export type VehiclePhotoRow = Database["public"]["Tables"]["vehicle_photos"]["Row"];

export type GalleryPhoto = VehiclePhotoRow & { signedUrl: string | null };

const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60;

async function fetchGalleryPhotos(vehicleId: string): Promise<GalleryPhoto[]> {
  const { data: photos, error } = await supabase
    .from("vehicle_photos")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!photos.length) return [];

  const paths = photos.map((p) => p.storage_path);
  const { data: signedUrls, error: signError } = await supabase.storage
    .from("vehicle-photos")
    .createSignedUrls(paths, PHOTO_SIGNED_URL_TTL_SECONDS);
  if (signError) throw signError;

  const signedUrlByPath = new Map(
    (signedUrls ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl as string]),
  );

  return photos.map((photo) => ({
    ...photo,
    signedUrl: signedUrlByPath.get(photo.storage_path) ?? null,
  }));
}

export function useVehicleGallery(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "gallery"],
    queryFn: () => fetchGalleryPhotos(vehicleId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

type UploadGalleryPhotoInput = {
  file: File;
  category: VehiclePhotoRow["category"];
  caption: string | null;
};

export function useUploadGalleryPhoto(vehicleId: string) {
  const { user } = useAuth();
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ file, category, caption }: UploadGalleryPhotoInput) => {
      if (!user) throw new Error("Sem usuário autenticado.");
      const path = `${user.id}/${vehicleId}/${crypto.randomUUID()}.${fileExtension(file)}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("vehicle_photos")
        .insert({
          vehicle_id: vehicleId,
          storage_path: path,
          category,
          caption,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useSetPrimaryPhoto(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from("vehicles")
        .update({ primary_photo_id: photoId })
        .eq("id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/** RN-5: se a foto excluída é a capa do veículo, limpa `primary_photo_id` antes de apagar — nunca deixa referência morta. */
export function useDeleteGalleryPhoto(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({
      photo,
      isPrimary,
    }: {
      photo: VehiclePhotoRow;
      isPrimary: boolean;
    }) => {
      if (isPrimary) {
        const { error: clearError } = await supabase
          .from("vehicles")
          .update({ primary_photo_id: null })
          .eq("id", vehicleId);
        if (clearError) throw clearError;
      }

      const { error: storageError } = await supabase.storage
        .from("vehicle-photos")
        .remove([photo.storage_path]);
      if (storageError) throw storageError;

      const { error } = await supabase
        .from("vehicle_photos")
        .delete()
        .eq("id", photo.id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
