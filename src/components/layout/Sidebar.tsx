import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { isVehicleScoped, SIDEBAR_NAV_ITEMS, resolveNavItem } from "@/lib/navigation";

/** Fase 14: item que depende de veículo só aparece quando há um selecionado — nunca mais mostra opção cinza fingindo ser clicável (ver docs/DECISIONS.md). */
export function Sidebar() {
  const vehicleId = useCurrentVehicleId();
  const visibleItems = SIDEBAR_NAV_ITEMS.filter((item) => !isVehicleScoped(item) || vehicleId);

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-surface p-3 lg:flex"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const href = resolveNavItem(item, vehicleId);
        if (!href) return null;

        return (
          <NavLink
            key={item.label}
            to={href}
            end={href === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-primary transition-colors duration-150 hover:bg-bg",
                isActive && "bg-bg font-medium",
              )
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
