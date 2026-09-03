import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type ProjectProgressRow = Database["public"]["Views"]["project_progress"]["Row"];

export type ProjectWithProgress = ProjectRow & {
  progress: ProjectProgressRow | null;
};

/** RN-1: progresso sempre vem de `project_progress` — combinado aqui com `projects` (CRUD), nunca calculado. */
async function fetchProjects(vehicleId: string): Promise<ProjectWithProgress[]> {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!projects.length) return [];

  const { data: progressRows, error: progressError } = await supabase
    .from("project_progress")
    .select("*")
    .in(
      "project_id",
      projects.map((p) => p.id),
    );
  if (progressError) throw progressError;

  const progressByProjectId = new Map((progressRows ?? []).map((p) => [p.project_id, p]));

  return projects.map((project) => ({
    ...project,
    progress: progressByProjectId.get(project.id) ?? null,
  }));
}

export function useProjects(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "projects"],
    queryFn: () => fetchProjects(vehicleId),
  });
}

async function fetchProject(vehicleId: string, projectId: string): Promise<ProjectWithProgress | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();
  if (error) throw error;
  if (!project) return null;

  const { data: progress, error: progressError } = await supabase
    .from("project_progress")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (progressError) throw progressError;

  return { ...project, progress: progress ?? null };
}

export function useProject(vehicleId: string, projectId: string) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "projects", projectId],
    queryFn: () => fetchProject(vehicleId, projectId),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
}

export function useCreateProject(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (input: Omit<ProjectInsert, "vehicle_id">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...input, vehicle_id: vehicleId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useUpdateProject(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async ({ id, ...input }: ProjectUpdate & { id: string }) => {
      const { error } = await supabase
        .from("projects")
        .update(input)
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}

export function useDeleteProject(vehicleId: string) {
  const invalidateVehicles = useInvalidateVehicles();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
    },
    onSuccess: () => invalidateVehicles(),
  });
}
