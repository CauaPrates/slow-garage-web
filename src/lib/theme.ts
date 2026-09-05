export type Theme = "dark" | "light";
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "slow-garage-theme";

/** Dark é o padrão absoluto quando não há preferência salva (decisão do produto) — "system" só entra quando a pessoa escolhe isso explicitamente em Configurações. */
export function getStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "system" ? stored : "dark";
  } catch {
    return "dark";
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
