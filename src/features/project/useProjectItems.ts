import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { deleteAttachmentIfExists, fetchAttachmentsByEntity } from "@/features/attachment/useAttachment";
import type { Database } from "@/types/database.types";
import type { AttachmentRow } from "@/features/attachment/useAttachment";

type ProjectItemRowBase = Database["public"]["Tables"]["project_items"]["Row"];
type ProjectItemInsert = Database["public"]["Tables"]["project_items"]["Insert"];
type ProjectItemUpdate = Database["public"]["Tables"]["project_items"]["Update"];

export type ProjectItemRow = ProjectItemRowBase & { attachment: AttachmentRow | null };

async function fetchProjectItems(projectId: string): Promise<ProjectItemRow[]> {
  const { data: items, error } = await supabase
    .from("project_items")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  if (!items.length) return [];

  const attachmentByItemId = await fetchAttachmentsByEntity(
    "project_item",
    items.map((i) => i.id),
  );

  return items.map((item) => ({
    ...item,
    attachment: attachmentByItemId.get(item.id) ?? null,
  }));
}

export function useProjectItems(projectId: string) {
  return useQuery({
    queryKey: ["project-items", projectId],
    queryFn: () => fetchProjectItems(projectId),
    enabled: !!projectId,
  });
}

function useInvalidateProjectItems() {
  const queryClient = useQueryClient();
  return (projectId: string) => {
    void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    void queryClient.invalidateQueries({ queryKey: ["project-items", projectId] });
  };
}

/**
 * RN-4: `vehicle_id` sempre o da rota atual — nunca outro, mesmo com
 * mais de um veículo. `project_id` é parte do input (não um parâmetro
 * fixo do hook) porque o atalho "Upgrade" escolhe o projeto dentro do
 * próprio formulário, no momento de salvar — a tela de detalhe do
 * projeto simplesmente sempre manda o mesmo `project_id` da rota.
 */
export function useCreateProjectItem(vehicleId: string) {
  const invalidate = useInvalidateProjectItems();

  return useMutation({
    mutationFn: async (input: Omit<ProjectItemInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("project_items")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => invalidate(data.project_id),
  });
}

export function useUpdateProjectItem() {
  const invalidate = useInvalidateProjectItems();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      ...input
    }: ProjectItemUpdate & { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("project_items")
        .update(input)
        .eq("id", id)
        .eq("project_id", projectId);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: ({ projectId }) => invalidate(projectId),
  });
}

/** RN-4: apaga o anexo antes do item, mesma regra de Gasto (Fase 4/ADR-027). */
export function useDeleteProjectItem() {
  const invalidate = useInvalidateProjectItems();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await deleteAttachmentIfExists("project_item", id);

      const { error } = await supabase
        .from("project_items")
        .delete()
        .eq("id", id)
        .eq("project_id", projectId);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: ({ projectId }) => invalidate(projectId),
  });
}
