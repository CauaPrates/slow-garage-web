/**
 * Exibida quando VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não estão
 * definidas. Tipografia de corpo, nunca a hero (ver spec RN-3) — isto
 * é uma mensagem de estado do sistema, não um dos quatro pontos de
 * destaque da marca.
 */
export function ConfigMissingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-text-primary">
      <p className="text-lg font-medium">Configuração do Supabase ausente</p>
      <p className="max-w-md text-sm text-text-secondary">
        As variáveis <code>VITE_SUPABASE_URL</code> e{" "}
        <code>VITE_SUPABASE_ANON_KEY</code> não foram encontradas. Copie{" "}
        <code>.env.example</code> para <code>.env</code>, preencha os
        valores do projeto Supabase de desenvolvimento e reinicie o
        servidor.
      </p>
    </div>
  );
}
