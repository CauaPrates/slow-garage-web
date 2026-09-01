import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // main.tsx nunca deve importar este módulo (nem transitivamente) sem
  // checar as variáveis de ambiente antes — ver ConfigMissingScreen.
  throw new Error(
    "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidas. Copie .env.example para .env e preencha.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
