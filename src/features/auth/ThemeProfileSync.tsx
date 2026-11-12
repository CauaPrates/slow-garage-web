import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "./useProfile";

/**
 * Puxa `profiles.theme` pro estado local quando o perfil carrega ou muda
 * (ex.: alterado em outro dispositivo) — ADR-069. Só "puxa" (chama
 * `setPreference`, que grava local/`localStorage`); nunca escreve de volta
 * no banco aqui — quem empurra pro banco é a própria ação do usuário em
 * `ThemePreferenceOptions`. Sem isso, um segundo dispositivo continuaria
 * preso na preferência local (ou no padrão "dark") mesmo depois da pessoa
 * escolher "claro" em Configurações no primeiro.
 *
 * Etapa 14: puxa só quando o valor do **perfil** chega ou muda, como a
 * ADR-069 descreve. Antes o efeito também rodava quando a escolha local
 * mudava: escolher "Claro" voltava pro tema do perfil durante a gravação
 * (claro → escuro → claro, medido) e, se a gravação falhava, a escolha era
 * desfeita sem aviso.
 */
export function ThemeProfileSync() {
  const { data: profile } = useProfile();
  const { preference, setPreference } = useTheme();
  // Último valor do perfil já aplicado: a escolha local mudar não puxa de novo o mesmo valor.
  const pulled = useRef<string | null>(null);

  useEffect(() => {
    const theme = profile?.theme;
    if (!theme || theme === pulled.current) return;
    pulled.current = theme;
    if (theme !== preference) {
      setPreference(theme);
    }
  }, [profile?.theme, preference, setPreference]);

  return null;
}
