import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";

async function fetchExpenseCategories() {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}

/** As 12 categorias de sistema + eventuais próprias do usuário (RN-5: nenhuma criada nesta fase). */
export function useExpenseCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expense-categories", user?.id],
    queryFn: fetchExpenseCategories,
    enabled: !!user,
  });
}
