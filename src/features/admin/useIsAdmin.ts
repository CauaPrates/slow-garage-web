import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { adminKeys } from "./queryKeys";

/**
 * Não existe role no JWT: `is_admin()` lê o banco a cada chamada
 * (docs/API_CONTRACT.md, Fase 14). Sem `staleTime` de propósito — o
 * default 0 do TanStack Query rechecka a cada montagem e a cada foco de
 * janela, então um admin rebaixado em outro dispositivo perde o menu e o
 * painel na próxima interação. Esconder menu é só UX; quem barra de
 * verdade é a RPC (403 `not_admin`, tratado em `Providers`).
 */
export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: adminKeys.isAdmin(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
