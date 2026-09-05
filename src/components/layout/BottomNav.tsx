import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { BOTTOM_NAV_ITEMS, isVehicleScoped, resolveNavItem, type NavItem } from "@/lib/navigation";
import { AddActionSheet } from "./AddActionSheet";
import { MoreSheet } from "./MoreSheet";

function BottomNavLink({ item, vehicleId }: { item: NavItem; vehicleId: string | null }) {
  const Icon = item.icon;
  const href = resolveNavItem(item, vehicleId);
  if (!href) return null;

  return (
    <NavLink
      to={href}
      end={href === "/"}
      className={({ isActive }) =>
        cn(
          "flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-text-secondary transition-colors duration-150",
          isActive && "text-accent",
        )
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="max-w-full truncate text-[10px]">{item.label}</span>
    </NavLink>
  );
}

/**
 * Fase 14: item que depende de veículo só aparece quando há um selecionado;
 * o FAB fica desabilitado (não a folha inteira) sem veículo. Fase 14g:
 * "Configurações" fica sempre por último (mesmo lugar fixo da sidebar);
 * o resto (Home/Carros/Dados, vehicle-scoped ou não) se divide nos dois
 * lados do FAB. A aba "Mais" (folha com as seções que não cabem aqui) só
 * aparece com veículo selecionado — todo item dela é vehicle-scoped, então
 * sem veículo ela não teria o que mostrar (mesma regra de "item some, não
 * aparece desabilitado" do resto da bottom nav).
 */
export function BottomNav() {
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const vehicleId = useCurrentVehicleId();
  const visibleItems = BOTTOM_NAV_ITEMS.filter((item) => !isVehicleScoped(item) || vehicleId);
  const settingsItem = visibleItems[visibleItems.length - 1];
  const linkItems = visibleItems.slice(0, -1);
  const mid = Math.ceil(linkItems.length / 2);
  const [before, after] = [linkItems.slice(0, mid), linkItems.slice(mid)];

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {before.map((item) => (
          <BottomNavLink key={item.label} item={item} vehicleId={vehicleId} />
        ))}

        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            aria-disabled={!vehicleId}
            aria-label={vehicleId ? "Adicionar" : "Adicionar — selecione um veículo"}
            onClick={() => vehicleId && setAddOpen(true)}
            className={cn(
              "flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-150",
              vehicleId ? "hover:scale-105" : "cursor-not-allowed opacity-40",
            )}
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {after.map((item) => (
          <BottomNavLink key={item.label} item={item} vehicleId={vehicleId} />
        ))}

        {vehicleId && (
          <button
            type="button"
            aria-label="Mais seções"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-text-secondary transition-colors duration-150"
          >
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
            <span className="max-w-full truncate text-[10px]">Mais</span>
          </button>
        )}

        {settingsItem && <BottomNavLink item={settingsItem} vehicleId={vehicleId} />}
      </nav>

      <AddActionSheet open={addOpen} onOpenChange={setAddOpen} />
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
