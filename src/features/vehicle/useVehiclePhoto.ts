import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function fileExtension(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  return fromName?.toLowerCase() ?? EXTENSION_BY_MIME_TYPE[file.type] ?? "jpg";
}

/** Foto principal — categoria "exterior" por padrão (única foto por veículo nesta fase). */
export function useUploadVehiclePhoto(vehicleId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Sem usuário autenticado.");
      const path = `${user.id}/${vehicleId}/${crypto.randomUUID()}.${fileExtension(file)}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: photo, error: insertError } = await supabase
        .from("vehicle_photos")
        .insert({
          vehicle_id: vehicleId,
          storage_path: path,
          category: "exterior",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("vehicles")
        .update({ primary_photo_id: photo.id })
        .eq("id", vehicleId);
      if (updateError) throw updateError;

      return photo;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles", user?.id] });
    },
  });
}
