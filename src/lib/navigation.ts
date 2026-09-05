import {
  Car,
  FileText,
  Fuel,
  History,
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Receipt,
  Settings,
  TrendingUp,
  Camera,
  StickyNote,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

/**
 * `to` como função significa "a tela existe, mas depende do veículo
 * atual" — resolvida via `resolveNavItem` a partir do `vehicleId` lido
 * da URL (Fase 4, ADR-024). `to` como string é sempre habilitado, sem
 * depender de veículo.
 *
 * Fase 14: item vehicle-scoped sem veículo selecionado não aparece mais
 * desabilitado na navegação — só some da lista (ver ADR em
 * docs/DECISIONS.md). `to: null`/"não construído ainda" foi removido
 * por ser código morto desde a Fase 9 (ADR-046): todo item da sidebar já
 * tem tela de verdade.
 */
export type NavItem = {
  label: string;
  icon: LucideIcon;
  to: string | ((vehicleId: string) => string);
  /** Fase 14b: fica fixo no rodapé da sidebar, fora do agrupamento por nível (só "Configurações" usa isso hoje). */
  pinBottom?: boolean;
};

export function isVehicleScoped(item: NavItem): boolean {
  return typeof item.to === "function";
}

export function resolveNavItem(item: NavItem, vehicleId: string | null): string | null {
  if (typeof item.to === "string") return item.to;
  return vehicleId ? item.to(vehicleId) : null;
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: (vehicleId) => ROUTES.vehicle(vehicleId) },
  { label: "Minha garagem", icon: Car, to: ROUTES.home },
  { label: "Gastos", icon: Receipt, to: (vehicleId) => ROUTES.vehicleExpenses(vehicleId) },
  { label: "Abastecimentos", icon: Fuel, to: (vehicleId) => ROUTES.vehicleFuelLogs(vehicleId) },
  { label: "Manutenção", icon: Wrench, to: (vehicleId) => ROUTES.vehicleMaintenance(vehicleId) },
  { label: "Problemas", icon: AlertTriangle, to: (vehicleId) => ROUTES.vehicleIssues(vehicleId) },
  { label: "Projetos", icon: ClipboardList, to: (vehicleId) => ROUTES.vehicleProjects(vehicleId) },
  { label: "Histórico", icon: History, to: (vehicleId) => ROUTES.vehicleTimeline(vehicleId) },
  { label: "Documentos", icon: FileText, to: (vehicleId) => ROUTES.vehicleDocuments(vehicleId) },
  { label: "Configurações", icon: Settings, to: ROUTES.configuracoes, pinBottom: true },
];

/**
 * "Carros" espelha "Minha garagem" da sidebar — rótulo mais curto pro
 * espaço apertado da bottom nav, mesmo destino (Fase 9). "Dashboard"
 * usa o mesmo rótulo/ícone da sidebar (Fase 14h) — a versão anterior
 * chamava esta aba de "Home", mas "home" do app é a garagem (`Carros`),
 * não o painel de 1 veículo; nomear os dois de jeito confuso foi
 * apontado pelo usuário (ver ADR-054 update). "Histórico" saiu daqui e
 * foi pra dentro da folha "Mais" (ver `MORE_SHEET_ITEMS`) — eram 4 abas
 * + FAB + "Mais" (6 elementos), apertado demais num telefone estreito.
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: (vehicleId) => ROUTES.vehicle(vehicleId) },
  { label: "Carros", icon: Car, to: ROUTES.home },
  { label: "Configurações", icon: Settings, to: ROUTES.configuracoes },
];

/**
 * Itens da folha "Mais" (aba da bottom nav, Fase 14g/h): as seções de
 * veículo que a sidebar mostra mas as 3 abas fixas (Dashboard/Carros/
 * Configurações) não cobrem — inclui "Histórico", que antes era aba
 * fixa própria (ver comentário de `BOTTOM_NAV_ITEMS`). Mesma ressalva do
 * ADD_SHEET_ITEMS — a aba "Mais" só aparece com veículo selecionado (ver
 * BottomNav.tsx), então todo item aqui sempre resolve uma rota.
 */
export const MORE_SHEET_ITEMS: NavItem[] = [
  { label: "Histórico", icon: History, to: (vehicleId) => ROUTES.vehicleTimeline(vehicleId) },
  { label: "Gastos", icon: Receipt, to: (vehicleId) => ROUTES.vehicleExpenses(vehicleId) },
  { label: "Abastecimentos", icon: Fuel, to: (vehicleId) => ROUTES.vehicleFuelLogs(vehicleId) },
  { label: "Manutenção", icon: Wrench, to: (vehicleId) => ROUTES.vehicleMaintenance(vehicleId) },
  { label: "Problemas", icon: AlertTriangle, to: (vehicleId) => ROUTES.vehicleIssues(vehicleId) },
  { label: "Projetos", icon: ClipboardList, to: (vehicleId) => ROUTES.vehicleProjects(vehicleId) },
  { label: "Documentos", icon: FileText, to: (vehicleId) => ROUTES.vehicleDocuments(vehicleId) },
];

/** Itens da folha "Adicionar" — a folha só abre quando o FAB está habilitado (há veículo), então todo item aqui é sempre resolvível. */
export const ADD_SHEET_ITEMS: NavItem[] = [
  { label: "Gasto", icon: Receipt, to: (vehicleId) => `${ROUTES.vehicleExpenses(vehicleId)}?novo=1` },
  {
    label: "Abastecimento",
    icon: Fuel,
    to: (vehicleId) => `${ROUTES.vehicleFuelLogs(vehicleId)}?novo=1`,
  },
  {
    label: "Manutenção",
    icon: Wrench,
    to: (vehicleId) => `${ROUTES.vehicleMaintenance(vehicleId)}?novo=1`,
  },
  {
    label: "Upgrade",
    icon: TrendingUp,
    to: (vehicleId) => `${ROUTES.vehicleProjects(vehicleId)}?novo=1`,
  },
  {
    label: "Foto",
    icon: Camera,
    to: (vehicleId) => `${ROUTES.vehicleDocuments(vehicleId)}?aba=fotos&novo=1`,
  },
  {
    label: "Nota",
    icon: StickyNote,
    to: (vehicleId) => `${ROUTES.vehicleTimeline(vehicleId)}?novo=1`,
  },
];
