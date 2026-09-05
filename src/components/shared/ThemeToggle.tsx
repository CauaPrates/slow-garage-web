import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";

/** Atalho rápido (cabeçalho/login) — sempre claro/escuro explícito. Controle completo com "seguir sistema" fica em Configurações (`ThemePreferenceSelect`). */
export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-text-primary">
      {isLight ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isLight ? "Claro" : "Escuro"}</span>
      <Switch
        checked={isLight}
        onCheckedChange={toggleTheme}
        aria-label="Alternar entre tema claro e escuro"
      />
    </label>
  );
}
