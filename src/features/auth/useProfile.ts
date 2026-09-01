import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateDisplayName() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!user) throw new Error("Sem usuário autenticado.");
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName || null })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}
