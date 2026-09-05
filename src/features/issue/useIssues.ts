import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { deleteAttachmentIfExists, fetchAttachmentsByEntity } from "@/features/attachment/useAttachment";
import type { Database } from "@/types/database.types";
import type { AttachmentRow } from "@/features/attachment/useAttachment";

type IssueRowBase = Database["public"]["Tables"]["issues"]["Row"];
type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"];
type IssueUpdate = Database["public"]["Tables"]["issues"]["Update"];

export type IssueRow = IssueRowBase & { attachment: AttachmentRow | null };

async function fetchIssues(vehicleId: string): Promise<IssueRow[]> {
  const { data: issues, error } = await supabase
    .from("issues")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("reported_on", { ascending: false });
  if (error) throw error;
  if (!issues.length) return [];

  const attachmentByIssueId = await fetchAttachmentsByEntity(
    "issue",
    issues.map((i) => i.id),
  );

  return issues.map((issue) => ({
    ...issue,
    attachment: attachmentByIssueId.get(issue.id) ?? null,
  }));
}

export function useIssues(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "issues"],
    queryFn: () => fetchIssues(vehicleId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateIssue(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<IssueInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("issues")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateIssue(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: IssueUpdate & { id: string }) => {
      const { error } = await supabase
        .from("issues")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

/** RN-4: apaga o anexo antes do problema, mesma regra de Gasto (Fase 4/ADR-027). */
export function useDeleteIssue(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteAttachmentIfExists("issue", id);

      const { error } = await supabase
        .from("issues")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
