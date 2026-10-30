import { useState } from "react";
import { matchPath, NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import {
  BOTTOM_NAV_ITEMS,
  MORE_SHEET_GROUPS,
  isVehicleScoped,
  resolveNavItem,
  type NavItem,
} from "@/lib/navigation";
import { AddActionSheet } from "./AddActionSheet";
import { MoreSheet } from "./MoreSheet";

/**
 * Aba ativa não depende só de cor: fio de 2px no topo, rótulo em negrito e
 * ícone no acento (além do `aria-current` do `NavLink`). Alvo de 56px de
 * altura, rótulo de 11px.
 */
function tabClassName(isActive: boolean) {
  return cn(
    "relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 text-[11px] transition-colors duration-(--duration-fast)",
    isActive
      ? "font-semibold text-text-primary before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:rounded-full before:bg-accent"
      : "text-text-secondary hover:text-text-primary",
  );
}

function BottomNavLink({ item, vehicleId }: { item: NavItem; vehicleId: string | null }) {
  const Icon = item.icon;
  const href = resolveNavItem(item, vehicleId);
  if (!href) return null;

  return (
    <NavLink to={href} end={item.end} className={({ isActive }) => tabClassName(isActive)}>
      {({ isActive }) => (
        <>
          <Icon className={cn("h-5 w-5", isActive && "text-accent")} aria-hidden="true" />
          <span className="max-w-full truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Fase 14: item que depende de veículo só aparece quando há um selecionado;
 * o botão central fica desabilitado (não a folha inteira) sem veículo. Fase
 * 14h: "Configurações" fica sempre por último (mesmo lugar fixo da
 * sidebar); os outros itens de `BOTTOM_NAV_ITEMS` (Dashboard/Garagem) ficam
 * à esquerda do botão central; "Mais" + "Configurações" à direita — 2 de
 * cada lado com veículo selecionado, 1 de cada lado sem (`Mais` some),
 * sempre simétrico (Fase 14i).
 *
 * Etapa 01: o botão central vira "Registrar" com rótulo visível (antes era
 * um "+" flutuante elevado) e continua só abrindo a folha de ações. "Mais"
 * fica marcado quando a página atual é uma das seções que moram nela —
 * antes nenhuma aba indicava onde a pessoa estava dentro de "Gastos" etc.
 */
export function BottomNav() {
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const vehicleId = useCurrentVehicleId();
  const { pathname } = useLocation();
  const visibleItems = BOTTOM_NAV_ITEMS.filter((item) => !isVehicleScoped(item) || vehicleId);
  const settingsItem = visibleItems[visibleItems.length - 1];
  const leftItems = visibleItems.slice(0, -1);

  const moreIsActive = MORE_SHEET_GROUPS.some((group) =>
    group.items.some((item) => {
      const href = resolveNavItem(item, vehicleId);
      return href ? matchPath({ path: href, end: false }, pathname) !== null : false;
    }),
  );

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {leftItems.map((item) => (
          <BottomNavLink key={item.label} item={item} vehicleId={vehicleId} />
        ))}

        <button
          type="button"
          aria-haspopup="dialog"
          aria-disabled={!vehicleId}
          aria-label={vehicleId ? undefined : "Registrar — selecione um veículo"}
          onClick={() => vehicleId && setAddOpen(true)}
          className={cn(
            "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-medium text-text-primary",
            !vehicleId && "cursor-not-allowed opacity-50",
          )}
        >
          <span
            className={cn(
              "flex h-7 w-11 items-center justify-center rounded-md transition-colors duration-(--duration-fast)",
              vehicleId ? "bg-accent text-accent-foreground" : "bg-state-active text-text-secondary",
            )}
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="max-w-full truncate">Registrar</span>
        </button>

        {vehicleId && (
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setMoreOpen(true)}
            className={tabClassName(moreIsActive)}
          >
            <LayoutGrid className={cn("h-5 w-5", moreIsActive && "text-accent")} aria-hidden="true" />
            <span className="max-w-full truncate">Mais</span>
            {moreIsActive && <span className="sr-only">(seção atual)</span>}
          </button>
        )}

        {settingsItem && <BottomNavLink item={settingsItem} vehicleId={vehicleId} />}
      </nav>

      <AddActionSheet open={addOpen} onOpenChange={setAddOpen} />
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
