import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { Database } from "@/types/database.types";

type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function fileExtension(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  return fromName?.toLowerCase() ?? EXTENSION_BY_MIME_TYPE[file.type] ?? "bin";
}

async function removeAttachment(attachment: AttachmentRow) {
  const { error: storageError } = await supabase.storage
    .from("vehicle-documents")
    .remove([attachment.storage_path]);
  if (storageError) throw storageError;

  const { error } = await supabase.from("attachments").delete().eq("id", attachment.id);
  if (error) throw error;
}

/** RN-1/RN-3: só existe depois que o gasto já foi criado; troca sempre remove o anexo anterior primeiro. */
export function useUploadExpenseAttachment(vehicleId: string, expenseId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      existing,
    }: {
      file: File;
      existing: AttachmentRow | null;
    }) => {
      if (!user) throw new Error("Sem usuário autenticado.");
      if (existing) {
        await removeAttachment(existing);
      }

      const path = `${user.id}/${vehicleId}/${crypto.randomUUID()}.${fileExtension(file)}`;
      const { error: uploadError } = await supabase.storage
        .from("vehicle-documents")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("attachments")
        .insert({
          vehicle_id: vehicleId,
          entity_type: "expense",
          entity_id: expenseId,
          storage_path: path,
          mime_type: file.type,
          file_size_bytes: file.size,
          original_filename: file.name,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useRemoveExpenseAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachment: AttachmentRow) => removeAttachment(attachment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

/** Signed URL sob demanda, só quando o usuário pede pra ver o anexo — sem cache, TTL curto de uso único. */
export async function getExpenseAttachmentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("vehicle-documents")
    .createSignedUrl(storagePath, 300);
  if (error) throw error;
  return data.signedUrl;
}
