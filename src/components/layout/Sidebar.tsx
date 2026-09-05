import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { isVehicleScoped, SIDEBAR_NAV_ITEMS, resolveNavItem, type NavItem } from "@/lib/navigation";

function NavItemLink({ item, href }: { item: NavItem; href: string }) {
  const Icon = item.icon;
  return (
    <NavLink
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
}

/**
 * Fase 14b: "Minha garagem" (lista de veículos) não é do mesmo nível que
 * "Gastos"/"Manutenção" etc. (dentro de um veículo específico) — misturar
 * os dois num único grupo plano deixava sem sentido o que estava contido
 * no quê. Agora: item de conta no topo, seção do veículo atual (com o
 * nome dele como rótulo, só quando há um selecionado) separada por
 * divisor, "Configurações" fixo no rodapé.
 */
export function Sidebar() {
  const vehicleId = useCurrentVehicleId();
  const { vehicle } = useVehicle(vehicleId ?? "");

  const accountItems = SIDEBAR_NAV_ITEMS.filter((item) => !isVehicleScoped(item) && !item.pinBottom);
  const vehicleItems = SIDEBAR_NAV_ITEMS.filter((item) => isVehicleScoped(item));
  const bottomItems = SIDEBAR_NAV_ITEMS.filter((item) => item.pinBottom);

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-surface p-3 lg:flex"
    >
      {accountItems.map((item) => {
        const href = resolveNavItem(item, vehicleId);
        if (!href) return null;
        return <NavItemLink key={item.label} item={item} href={href} />;
      })}

      {vehicleId && (
        <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
          <p className="truncate px-3 pb-1 text-xs tracking-wide text-text-secondary uppercase">
            {vehicle ? `${vehicle.make} ${vehicle.model}` : "Veículo"}
          </p>
          {vehicleItems.map((item) => {
            const href = resolveNavItem(item, vehicleId);
            if (!href) return null;
            return <NavItemLink key={item.label} item={item} href={href} />;
          })}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2">
        {bottomItems.map((item) => {
          const href = resolveNavItem(item, vehicleId);
          if (!href) return null;
          return <NavItemLink key={item.label} item={item} href={href} />;
        })}
      </div>
    </nav>
  );
}
