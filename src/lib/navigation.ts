import {
  Car,
  FileText,
  Fuel,
  Gauge,
  History,
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Receipt,
  Settings,
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
  /**
   * Etapa 01: só fica ativo na rota exata. Sem isso o "Dashboard"
   * (`/v/:id`) casava com toda subpágina do veículo e aparecia selecionado
   * junto com "Gastos", "Projetos" etc.
   */
  end?: boolean;
};

/**
 * Etapa 01: título visual que organiza links que já existem — não é
 * página, não é rota, não esconde link atrás de clique. `label: null` é o
 * bloco sem título (o "Dashboard", porta de entrada do veículo).
 */
export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

export function isVehicleScoped(item: NavItem): boolean {
  return typeof item.to === "function";
}

export function resolveNavItem(item: NavItem, vehicleId: string | null): string | null {
  if (typeof item.to === "string") return item.to;
  return vehicleId ? item.to(vehicleId) : null;
}

const GARAGE: NavItem = { label: "Minha garagem", icon: Car, to: ROUTES.home, end: true };
const SETTINGS: NavItem = { label: "Configurações", icon: Settings, to: ROUTES.configuracoes };
const DASHBOARD: NavItem = {
  label: "Dashboard",
  icon: LayoutDashboard,
  to: (vehicleId) => ROUTES.vehicle(vehicleId),
  end: true,
};
const EXPENSES: NavItem = { label: "Gastos", icon: Receipt, to: (vehicleId) => ROUTES.vehicleExpenses(vehicleId) };
const FUEL: NavItem = { label: "Abastecimentos", icon: Fuel, to: (vehicleId) => ROUTES.vehicleFuelLogs(vehicleId) };
const MAINTENANCE: NavItem = {
  label: "Manutenção",
  icon: Wrench,
  to: (vehicleId) => ROUTES.vehicleMaintenance(vehicleId),
};
const ISSUES: NavItem = { label: "Problemas", icon: AlertTriangle, to: (vehicleId) => ROUTES.vehicleIssues(vehicleId) };
const MODIFICATIONS: NavItem = {
  label: "Modificações",
  icon: Gauge,
  to: (vehicleId) => ROUTES.vehicleModifications(vehicleId),
};
// Sem `end`: "Projetos" continua ativo dentro do detalhe (`/projetos/:projectId`).
const PROJECTS: NavItem = {
  label: "Projetos",
  icon: ClipboardList,
  to: (vehicleId) => ROUTES.vehicleProjects(vehicleId),
};
const TIMELINE: NavItem = { label: "Histórico", icon: History, to: (vehicleId) => ROUTES.vehicleTimeline(vehicleId) };
const PHOTOS: NavItem = { label: "Fotos", icon: Camera, to: (vehicleId) => ROUTES.vehiclePhotos(vehicleId) };
// Obrigações e financiamento continuam como abas de Documentos (`?aba=`), não como item próprio.
const DOCUMENTS: NavItem = {
  label: "Documentos",
  icon: FileText,
  to: (vehicleId) => ROUTES.vehicleDocuments(vehicleId),
};

/** A. Destinos gerais — sempre visíveis, com ou sem veículo. */
export const GENERAL_NAV_ITEMS: NavItem[] = [GARAGE];

/**
 * Seções do veículo atual, agrupadas por assunto. As mesmas 9 seções da
 * folha "Mais" do mobile — `MORE_SHEET_GROUPS` é esta lista sem o bloco do
 * Dashboard, que lá já é aba fixa.
 */
const VEHICLE_SECTION_GROUPS: NavGroup[] = [
  { label: "Custos", items: [EXPENSES, FUEL] },
  { label: "Cuidados", items: [MAINTENANCE, ISSUES] },
  { label: "Preparação", items: [MODIFICATIONS, PROJECTS] },
  { label: "Arquivo", items: [TIMELINE, PHOTOS, DOCUMENTS] },
];

/** B. Seções do veículo atual — só renderizadas quando há veículo (ADR-049). */
export const VEHICLE_NAV_GROUPS: NavGroup[] = [{ label: null, items: [DASHBOARD] }, ...VEHICLE_SECTION_GROUPS];

/** C. Conta — fixo no rodapé da sidebar. "Painel admin" entra junto, mas depende de `is_admin`, então é montado no `Sidebar`. */
export const ACCOUNT_NAV_ITEMS: NavItem[] = [SETTINGS];

/**
 * "Garagem" espelha "Minha garagem" da sidebar — rótulo mais curto pro
 * espaço apertado da bottom nav, mesmo destino (Fase 9; era "Carros" até a
 * etapa 01). "Dashboard" usa o mesmo rótulo/ícone da sidebar (Fase 14h).
 * "Histórico" fica dentro da folha "Mais" (ver `MORE_SHEET_GROUPS`) —
 * eram 4 abas + FAB + "Mais" (6 elementos), apertado demais num telefone
 * estreito. "Configurações" é sempre o último item — rotulado "Ajustes"
 * aqui: com 5 abas em 360px cada uma tem ~66px úteis e "Configurações" a
 * 11px mede ~77px (medido), então truncava. Mesmo destino e mesmo ícone.
 */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  DASHBOARD,
  { ...GARAGE, label: "Garagem" },
  { ...SETTINGS, label: "Ajustes" },
];

/**
 * Folha "Mais" (aba da bottom nav, Fase 14g/h): as seções de veículo que
 * as abas fixas (Dashboard/Garagem/Configurações) não cobrem, nos mesmos
 * grupos da sidebar. A aba "Mais" só aparece com veículo selecionado (ver
 * BottomNav.tsx), então todo item aqui sempre resolve uma rota.
 */
export const MORE_SHEET_GROUPS: NavGroup[] = VEHICLE_SECTION_GROUPS;

/** Itens da folha "Registrar" — a folha só abre quando o botão está habilitado (há veículo), então todo item aqui é sempre resolvível. */
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
    icon: Gauge,
    to: (vehicleId) => `${ROUTES.vehicleModifications(vehicleId)}?novo=1`,
  },
  {
    label: "Foto",
    icon: Camera,
    to: (vehicleId) => `${ROUTES.vehiclePhotos(vehicleId)}?novo=1`,
  },
  {
    label: "Nota",
    icon: StickyNote,
    to: (vehicleId) => `${ROUTES.vehicleTimeline(vehicleId)}?novo=1`,
  },
];
