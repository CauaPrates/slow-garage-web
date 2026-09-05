import { useEffect } from "react";
import { useLocation, useMatch } from "react-router-dom";
import { ROUTES } from "@/lib/routes";

const STORAGE_KEY = "slow-garage-last-vehicle-id";

/**
 * O veículo atual mora na URL (RN-1 de specs/003-vehicle-shell/spec.md),
 * nunca em contexto React. Componentes de chrome global (Sidebar,
 * AddActionSheet) que precisam saber "qual veículo está aberto agora"
 * leem direto da rota, casando qualquer sub-rota de `/v/:vehicleId`.
 *
 * Exceção pontual (Fase 14o): em `/configuracoes` — uma tela de conta,
 * não de veículo — usar o último `vehicleId` visto (guardado em
 * `sessionStorage`) como fallback. Sem isso, entrar em Configurações
 * "resetava" sidebar/bottom nav pro estado sem veículo (só "Minha
 * garagem" + "Configurações"), como se tivesse saído do contexto do
 * carro — o usuário só queria trocar uma preferência e continuar de
 * onde estava. Em qualquer outra rota sem veículo na URL (a própria
 * "Minha garagem", por exemplo) o comportamento continua o mesmo:
 * `null`, sem fallback — ali "nenhum veículo selecionado" é o estado
 * certo (ADR-049), não um esquecimento.
 */
export function useCurrentVehicleId(): string | null {
  const match = useMatch("/v/:vehicleId/*");
  const location = useLocation();
  const vehicleIdFromUrl = match?.params.vehicleId ?? null;

  useEffect(() => {
    if (!vehicleIdFromUrl) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, vehicleIdFromUrl);
    } catch {
      // sessionStorage indisponível (modo privado etc.) — sem fallback depois, mas não quebra o app
    }
  }, [vehicleIdFromUrl]);

  if (vehicleIdFromUrl) return vehicleIdFromUrl;

  if (location.pathname === ROUTES.configuracoes) {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  return null;
}
