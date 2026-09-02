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
 */
export type NavItem = {
  label: string;
  icon: LucideIcon;
  to: string | null;
};

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: null },
  { label: "Minha garagem", icon: Car, to: ROUTES.home },
  { label: "Gastos", icon: Receipt, to: null },
  { label: "Abastecimentos", icon: Fuel, to: null },
  { label: "Manutenção", icon: Wrench, to: null },
  { label: "Problemas", icon: AlertTriangle, to: null },
  { label: "Projetos", icon: ClipboardList, to: null },
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

export type AddSheetItem = {
  label: string;
  icon: LucideIcon;
  to: null;
};

/** Nenhum fluxo de registro existe até a Fase 4 — todos desabilitados por ora. */
export const ADD_SHEET_ITEMS: AddSheetItem[] = [
  { label: "Gasto", icon: Receipt, to: null },
  { label: "Abastecimento", icon: Fuel, to: null },
  { label: "Manutenção", icon: Wrench, to: null },
  { label: "Upgrade", icon: TrendingUp, to: null },
  { label: "Foto", icon: Camera, to: null },
  { label: "Nota", icon: StickyNote, to: null },
];
