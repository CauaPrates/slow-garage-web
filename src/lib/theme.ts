export type Theme = "dark" | "light";

const STORAGE_KEY = "slow-garage-theme";

/** Dark é o padrão absoluto — não consulta prefers-color-scheme (decisão do produto). */
export function getStoredTheme(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage indisponível (modo privado etc.) — tema não persiste, mas não quebra o app
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("light", theme === "light");
}
