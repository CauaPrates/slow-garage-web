import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { fileExtension } from "@/lib/fileExtension";
import type { Database } from "@/types/database.types";

export type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];
export type AttachmentEntityType = Database["public"]["Enums"]["attachment_entity_type"];

/** Join usado por toda lista que embute o anexo da própria entidade (mesmo padrão de `fetchExpenses` desde a Fase 4). */
export async function fetchAttachmentsByEntity(
  entityType: AttachmentEntityType,
  entityIds: string[],
): Promise<Map<string, AttachmentRow>> {
  if (!entityIds.length) return new Map();
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds);
  if (error) throw error;
  return new Map((data ?? []).map((a) => [a.entity_id, a]));
}

async function removeAttachment(attachment: AttachmentRow) {
  const { error: storageError } = await supabase.storage
    .from("vehicle-documents")
    .remove([attachment.storage_path]);
  if (storageError) throw storageError;

  const { error } = await supabase.from("attachments").delete().eq("id", attachment.id);
  if (error) throw error;
}

/**
 * RN-4: busca o anexo direto do servidor (não confia em cache) antes de
 * excluir o registro dono — evita anexo órfão numa corrida entre anexar e
 * excluir (lição da Fase 4/ADR-027, agora compartilhada por toda entidade).
 */
export async function deleteAttachmentIfExists(
  entityType: AttachmentEntityType,
  entityId: string,
) {
  const { data: existing, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();
  if (error) throw error;
  if (existing) {
    await removeAttachment(existing);
  }
}

/**
 * `extraInvalidateKeys` cobre listas cuja query key não começa com
 * `['vehicles']` — ex.: item de projeto usa `['project-items', projectId]`.
 */
export function useUploadAttachment(options: {
  entityType: AttachmentEntityType;
  vehicleId: string;
  entityId: string;
  extraInvalidateKeys?: QueryKey[];
}) {
  const { entityType, vehicleId, entityId, extraInvalidateKeys } = options;
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
          entity_type: entityType,
          entity_id: entityId,
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
      for (const key of extraInvalidateKeys ?? []) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useRemoveAttachment(extraInvalidateKeys?: QueryKey[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachment: AttachmentRow) => removeAttachment(attachment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      for (const key of extraInvalidateKeys ?? []) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

/** Signed URL sob demanda, só quando o usuário pede pra ver o anexo — sem cache, TTL curto de uso único. */
export async function getAttachmentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("vehicle-documents")
    .createSignedUrl(storagePath, 300);
  if (error) throw error;
  return data.signedUrl;
}
