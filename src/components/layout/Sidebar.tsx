import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import {
  DISABLED_REASON_LABEL,
  SIDEBAR_NAV_ITEMS,
  resolveNavItem,
  type DisabledReason,
} from "@/lib/navigation";

export function Sidebar() {
  const vehicleId = useCurrentVehicleId();
  const resolvedItems = SIDEBAR_NAV_ITEMS.map((item) => ({
    item,
    resolved: resolveNavItem(item, vehicleId),
  }));
  const disabledReasons = new Set(
    resolvedItems
      .map(({ resolved }) => (resolved.enabled ? null : resolved.reason))
      .filter((reason): reason is DisabledReason => reason !== null),
  );

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-surface p-3 lg:flex"
    >
      {resolvedItems.map(({ item, resolved }) => {
        const Icon = item.icon;

        if (!resolved.enabled) {
          return (
            <button
              key={item.label}
              type="button"
              aria-disabled="true"
              aria-label={`${item.label} — ${DISABLED_REASON_LABEL[resolved.reason]}`}
              onClick={(event) => event.preventDefault()}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary opacity-50 cursor-not-allowed"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
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

      {/* Motivo mostrado uma vez só, não repetido por item desabilitado — ver ADR sobre a correção do menu. */}
      {disabledReasons.size > 0 && (
        <p className="mt-2 border-t border-border px-3 pt-3 text-xs text-text-secondary">
          {[...disabledReasons].map((reason) => DISABLED_REASON_LABEL[reason]).join(" · ")}
        </p>
      )}
    </nav>
  );
}
