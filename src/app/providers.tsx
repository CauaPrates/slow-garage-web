import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  applyTheme,
  getStoredPreference,
  storePreference,
  type Theme,
  type ThemePreference,
} from "@/lib/theme";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProfileSync } from "@/features/auth/ThemeProfileSync";
import { isNotAdminError } from "@/features/admin/errors";
import { IS_ADMIN_KEY } from "@/features/admin/queryKeys";

type ThemeContextValue = {
  /** Preferência escolhida — "system" acompanha o SO; "light"/"dark" é escolha explícita. */
  preference: ThemePreference;
  /** Tema efetivamente aplicado (já resolvido a partir de "system", se for o caso). */
  resolvedTheme: Theme;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Fase 031: qualquer query ou mutation que volte `403 not_admin` (admin
 * rebaixado em outra aba/dispositivo) marca `is_admin` como `false` no
 * cache — o `AdminRoute` reage a isso tirando a pessoa do painel, e o
 * menu some. Num lugar só em vez de em cada hook do painel.
 */
function handleNotAdmin(error: unknown) {
  if (isNotAdminError(error)) {
    queryClient.setQueriesData({ queryKey: IS_ADMIN_KEY }, false);
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleNotAdmin }),
  mutationCache: new MutationCache({ onError: handleNotAdmin }),
});

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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
        <AuthProvider>
          <ThemeProfileSync />
          {children}
        </AuthProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
