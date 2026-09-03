import { useMatch } from "react-router-dom";

/**
 * O veículo atual mora na URL (RN-1 de specs/003-vehicle-shell/spec.md),
 * nunca em contexto React. Componentes de chrome global (Sidebar,
 * AddActionSheet) que precisam saber "qual veículo está aberto agora"
 * leem direto da rota, casando qualquer sub-rota de `/v/:vehicleId`.
 */
export function useCurrentVehicleId(): string | null {
  const match = useMatch("/v/:vehicleId/*");
  return match?.params.vehicleId ?? null;
}
