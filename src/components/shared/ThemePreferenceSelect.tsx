import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/useTheme";
import { useUpdateThemePreference } from "@/features/auth/useProfile";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "dark", label: "Escuro" },
  { value: "light", label: "Claro" },
  { value: "system", label: "Seguir o sistema" },
];

/**
 * Controle completo de tema (Configurações) — diferente do `ThemeToggle`
 * (atalho binário só na tela de login), aqui inclui "seguir o sistema".
 * Escolher uma opção grava local (`setPreference`, aplica na hora) **e**
 * em `profiles.theme` (ADR-069) — o pull de volta (outro dispositivo
 * lendo essa escolha) é `ThemeProfileSync`, não este componente.
 */
export function ThemePreferenceSelect() {
  const { preference, setPreference } = useTheme();
  const updateThemePreference = useUpdateThemePreference();

  function handleChange(next: ThemePreference) {
    setPreference(next);
    updateThemePreference.mutate(next);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="theme-preference">Tema</Label>
      <Select
        id="theme-preference"
        value={preference}
        onChange={(event) => handleChange(event.target.value as ThemePreference)}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
