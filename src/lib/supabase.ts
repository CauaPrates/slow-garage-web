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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Ambos já são o default do client — explícitos porque o app depende
    // ativamente desse comportamento (sessão sobrevive ao reload, e o
    // link de confirmação/recuperação de e-mail é processado sozinho).
    persistSession: true,
    detectSessionInUrl: true,
  },
});
