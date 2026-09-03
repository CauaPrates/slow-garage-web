import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import {
  DISABLED_REASON_LABEL,
  SIDEBAR_NAV_ITEMS,
  resolveNavItem,
} from "@/lib/navigation";

export function Sidebar() {
  const vehicleId = useCurrentVehicleId();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-surface p-3 lg:flex"
    >
      {SIDEBAR_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const resolved = resolveNavItem(item, vehicleId);

        if (!resolved.enabled) {
          return (
            <button
              key={item.label}
              type="button"
              aria-disabled="true"
              onClick={(event) => event.preventDefault()}
              className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-text-secondary opacity-50 cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </span>
              <span className="text-xs">{DISABLED_REASON_LABEL[resolved.reason]}</span>
            </button>
          );
        }

        return (
          <NavLink
            key={item.label}
            to={resolved.href}
            end={resolved.href === "/"}
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
