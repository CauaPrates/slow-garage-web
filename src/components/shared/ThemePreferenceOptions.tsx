import { useId, type ComponentType } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { useTheme } from "@/hooks/useTheme";
import { useUpdateThemePreference } from "@/features/auth/useProfile";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: "true" }> }[] = [
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
  { value: "system", label: "Seguir o sistema", icon: Monitor },
];

/**
 * Tema em Configurações. Escolher uma opção aplica na hora neste aparelho
 * (`setPreference`, que também guarda no `localStorage`) **e** grava em
 * `profiles.theme` (ADR-069) — o pull de volta (outro dispositivo lendo essa
 * escolha) é `ThemeProfileSync`.
 *
 * Etapa 14: era um `<select>`; virou um grupo de opções (rádios nativos:
 * setas trocam, Tab entra e sai do grupo) com a escolha à vista, alvo de 56px
 * e, em "Seguir o sistema", o tema que está valendo agora. A gravação na conta
 * ganhou estado junto do grupo — antes a falha era silenciosa.
 */
export function ThemePreferenceOptions() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const updateThemePreference = useUpdateThemePreference();
  const name = useId();

  function handleChange(next: ThemePreference) {
    setPreference(next);
    updateThemePreference.mutate(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="type-label mb-2 text-text-primary">Tema</legend>
        <div className="grid grid-cols-1 gap-2 @md:grid-cols-3">
          {OPTIONS.map(({ value, label, icon: Icon }) => {
            const id = `${name}-${value}`;
            const checked = preference === value;
            return (
              <label
                key={value}
                htmlFor={id}
                className={cn(
                  "flex min-h-control-touch cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors duration-(--duration-fast)",
                  checked ? "border-accent bg-state-active" : "border-border-strong/60 hover:border-border-strong hover:bg-state-hover",
                )}
              >
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={value}
                  checked={checked}
                  onChange={() => handleChange(value)}
                  className="size-4 shrink-0 accent-(--color-accent)"
                />
                <Icon className={cn("h-4 w-4 shrink-0", checked ? "text-text-primary" : "text-text-secondary")} aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className={cn("text-sm text-text-primary", checked && "font-medium")}>{label}</span>
                  {value === "system" && (
                    <span className="type-caption text-text-secondary">Agora: {resolvedTheme === "light" ? "claro" : "escuro"}</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {updateThemePreference.isError ? (
        <Alert
          tone="warning"
          role="alert"
          action={
            <Button variant="outline" onClick={() => updateThemePreference.mutate(preference)}>
              Tentar de novo
            </Button>
          }
        >
          Aplicado neste aparelho, mas não foi salvo na sua conta. Em outro aparelho o tema continua o anterior.
        </Alert>
      ) : (
        <p role="status" className="type-caption min-h-4 text-text-secondary">
          {updateThemePreference.isPending
            ? "Salvando na sua conta…"
            : updateThemePreference.isSuccess
              ? "Salvo na sua conta."
              : ""}
        </p>
      )}
    </div>
  );
}
