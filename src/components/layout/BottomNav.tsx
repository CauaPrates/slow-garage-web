import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import {
  BOTTOM_NAV_ITEMS,
  DISABLED_REASON_LABEL,
  resolveNavItem,
  type NavItem,
} from "@/lib/navigation";
import { AddActionSheet } from "./AddActionSheet";

function BottomNavLink({ item, vehicleId }: { item: NavItem; vehicleId: string | null }) {
  const Icon = item.icon;
  const resolved = resolveNavItem(item, vehicleId);

  if (!resolved.enabled) {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={`${item.label} — ${DISABLED_REASON_LABEL[resolved.reason]}`}
        onClick={(event) => event.preventDefault()}
        className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 opacity-50 cursor-not-allowed"
      >
        <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        <span
          className="max-w-full truncate text-[10px] text-text-secondary"
          aria-hidden="true"
        >
          {DISABLED_REASON_LABEL[resolved.reason]}
        </span>
      </button>
    );
  }

  return (
    <NavLink
      to={resolved.href}
      end={resolved.href === "/"}
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

export function BottomNav() {
  const [addOpen, setAddOpen] = useState(false);
  const vehicleId = useCurrentVehicleId();
  const [before, after] = [BOTTOM_NAV_ITEMS.slice(0, 2), BOTTOM_NAV_ITEMS.slice(2)];

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
            aria-label="Adicionar"
            onClick={() => setAddOpen(true)}
            className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-150 hover:scale-105"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {after.map((item) => (
          <BottomNavLink key={item.label} item={item} vehicleId={vehicleId} />
        ))}
      </nav>

      <AddActionSheet open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
