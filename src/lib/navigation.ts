import {
  Car,
  FileText,
  Fuel,
  History,
  Home,
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
 * `to: null` significa "a tela ainda não existe" (chega em fase futura,
 * ver tabela de fases do doc mestre) — o item aparece na navegação desde
 * já, desabilitado com "Em breve", em vez de sumir e reaparecer fase a
 * fase (RN-2 de specs/003-vehicle-shell/spec.md).
 *
 * `to` como função significa "a tela existe, mas depende do veículo
 * atual" — resolvida via `resolveNavItem` a partir do `vehicleId` lido
 * da URL (Fase 4, ADR-024): sem veículo selecionado, o item também
 * fica desabilitado, mas por um motivo diferente ("Selecione um
 * veículo", não "Em breve").
 */
export type NavItem = {
  label: string;
  icon: LucideIcon;
  to: string | null | ((vehicleId: string) => string);
};

export type DisabledReason = "not-built" | "no-vehicle";

export type ResolvedNavItem =
  | { enabled: true; href: string }
  | { enabled: false; reason: DisabledReason };

export function resolveNavItem(item: NavItem, vehicleId: string | null): ResolvedNavItem {
  if (item.to === null) return { enabled: false, reason: "not-built" };
  if (typeof item.to === "string") return { enabled: true, href: item.to };
  if (vehicleId) return { enabled: true, href: item.to(vehicleId) };
  return { enabled: false, reason: "no-vehicle" };
}

export const DISABLED_REASON_LABEL: Record<DisabledReason, string> = {
  "not-built": "Em breve",
  "no-vehicle": "Selecione um veículo",
};

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: null },
  { label: "Minha garagem", icon: Car, to: ROUTES.home },
  { label: "Gastos", icon: Receipt, to: (vehicleId) => ROUTES.vehicleExpenses(vehicleId) },
  { label: "Abastecimentos", icon: Fuel, to: (vehicleId) => ROUTES.vehicleFuelLogs(vehicleId) },
  { label: "Manutenção", icon: Wrench, to: (vehicleId) => ROUTES.vehicleMaintenance(vehicleId) },
  { label: "Problemas", icon: AlertTriangle, to: (vehicleId) => ROUTES.vehicleIssues(vehicleId) },
  { label: "Projetos", icon: ClipboardList, to: (vehicleId) => ROUTES.vehicleProjects(vehicleId) },
  { label: "Histórico", icon: History, to: null },
  { label: "Documentos", icon: FileText, to: null },
  { label: "Configurações", icon: Settings, to: ROUTES.configuracoes },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: Home, to: null },
  { label: "Carros", icon: Car, to: ROUTES.home },
  { label: "Dados", icon: History, to: null },
  { label: "Configurações", icon: Settings, to: ROUTES.configuracoes },
];

/** Itens da folha "Adicionar" — mesma forma de `NavItem`; "Gasto" é o primeiro a sair de `to: null` (Fase 4). */
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
  { label: "Foto", icon: Camera, to: null },
  { label: "Nota", icon: StickyNote, to: null },
];
