import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  applyTheme,
  getStoredPreference,
  storePreference,
  type Theme,
  type ThemePreference,
} from "@/lib/theme";
import { AuthProvider } from "@/features/auth/AuthProvider";

type ThemeContextValue = {
  /** Preferência escolhida — "system" acompanha o SO; "light"/"dark" é escolha explícita. */
  preference: ThemePreference;
  /** Tema efetivamente aplicado (já resolvido a partir de "system", se for o caso). */
  resolvedTheme: Theme;
  setPreference: (preference: ThemePreference) => void;
  /** Alterna entre claro/escuro explícito — usado pelo atalho rápido do cabeçalho/login, sempre define uma preferência explícita (nunca "system"). */
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const queryClient = new QueryClient();

function subscribeToSystemTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/** Lê `prefers-color-scheme` ao vivo — `useSyncExternalStore` em vez de `useEffect` + `setState` pra não disparar o "setState síncrono dentro de effect" que o lint (`react-hooks/set-state-in-effect`) já pegou numa versão anterior desta função. */
function useSystemPrefersLight(): boolean {
  return useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia("(prefers-color-scheme: light)").matches,
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    getStoredPreference(),
  );
  const systemPrefersLight = useSystemPrefersLight();
  const resolvedTheme: Theme =
    preference === "system" ? (systemPrefersLight ? "light" : "dark") : preference;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    storePreference(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((current) => {
      const currentlyLight =
        current === "system" ? systemPrefersLight : current === "light";
      const next: ThemePreference = currentlyLight ? "dark" : "light";
      storePreference(next);
      return next;
    });
  }, [systemPrefersLight]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference, toggleTheme }}>
        <AuthProvider>{children}</AuthProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
