import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";

const root = createRoot(document.getElementById("root")!);

const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

if (!hasSupabaseConfig) {
  // Import dinâmico: garante que nada que dependa (direta ou
  // transitivamente) do client Supabase seja sequer carregado quando a
  // configuração está ausente — import estático seria avaliado mesmo
  // no ramo não executado. Ver AC-8.
  const { ConfigMissingScreen } = await import(
    "@/components/shared/ConfigMissingScreen"
  );
  root.render(
    <StrictMode>
      <ConfigMissingScreen />
    </StrictMode>,
  );
} else {
  const [{ Providers }, { RouterProvider }, { router }] = await Promise.all([
    import("@/app/providers"),
    import("react-router-dom"),
    import("@/app/router"),
  ]);
  root.render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
}
