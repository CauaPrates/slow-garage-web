export type Theme = "dark" | "light";
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "slow-garage-theme";

/** Sem preferência salva, o padrão é seguir o sistema operacional — "dark"/"light" só valem quando a pessoa escolhe explicitamente em Configurações. */
export function getStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function storePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // localStorage indisponível (modo privado etc.) — preferência não persiste, mas não quebra o app
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("light", theme === "light");
}
