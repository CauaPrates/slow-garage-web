import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "./useProfile";

/**
 * Puxa `profiles.theme` pro estado local quando o perfil carrega ou muda
 * (ex.: alterado em outro dispositivo) — ADR-069. Só "puxa" (chama
 * `setPreference`, que grava local/`localStorage`); nunca escreve de volta
 * no banco aqui — quem empurra pro banco é a própria ação do usuário em
 * `ThemePreferenceSelect`. Sem isso, um segundo dispositivo continuaria
 * preso na preferência local (ou no padrão "dark") mesmo depois da pessoa
 * escolher "claro" em Configurações no primeiro.
 */
export function ThemeProfileSync() {
  const { data: profile } = useProfile();
  const { preference, setPreference } = useTheme();

  useEffect(() => {
    if (profile?.theme && profile.theme !== preference) {
      setPreference(profile.theme);
    }
  }, [profile?.theme, preference, setPreference]);

  return null;
}
