import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SIDEBAR_NAV_ITEMS } from "@/lib/navigation";

export function Sidebar() {
  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-surface p-3 lg:flex"
    >
      {SIDEBAR_NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        if (item.to === null) {
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
              <span className="text-xs">Em breve</span>
            </button>
          );
        }

        return (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
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
