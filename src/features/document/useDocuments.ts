import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { fileExtension } from "@/lib/fileExtension";
import type { Database } from "@/types/database.types";

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

async function fetchDocuments(vehicleId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("expires_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function useDocuments(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "documents"],
    queryFn: () => fetchDocuments(vehicleId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

type CreateDocumentInput = {
  docType: DocumentRow["doc_type"] | undefined;
  title: string;
  expiresOn: string | null;
  issuedOn: string | null;
  amount: number | null;
  notes: string | null;
  file: File;
};

/** RN-6: sobe o arquivo antes de criar a linha — se o upload falhar, nenhum registro órfão fica no banco. */
export function useCreateDocument(vehicleId: string) {
  const { user } = useAuth();
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      if (!user) throw new Error("Sem usuário autenticado.");
      const path = `${user.id}/${vehicleId}/${crypto.randomUUID()}.${fileExtension(input.file)}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-documents")
        .upload(path, input.file, { contentType: input.file.type });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("documents")
        .insert({
          vehicle_id: vehicleId,
          doc_type: input.docType,
          title: input.title,
          expires_on: input.expiresOn,
          issued_on: input.issuedOn,
          amount: input.amount,
          notes: input.notes,
          storage_path: path,
          mime_type: input.file.type,
          file_size_bytes: input.file.size,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateDocument(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: DocumentUpdate & { id: string }) => {
      const { error } = await supabase
        .from("documents")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/** RN-6: apaga o arquivo do Storage antes da linha — nunca deixa arquivo órfão. */
export function useDeleteDocument(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (document: DocumentRow) => {
      const { error: storageError } = await supabase.storage
        .from("vehicle-documents")
        .remove([document.storage_path]);
      if (storageError) throw storageError;

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/** Signed URL sob demanda, sem cache, TTL curto de uso único — mesmo padrão de anexo. */
export async function getDocumentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("vehicle-documents")
    .createSignedUrl(storagePath, 300);
  if (error) throw error;
  return data.signedUrl;
}
