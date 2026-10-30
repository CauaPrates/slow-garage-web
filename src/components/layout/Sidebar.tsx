import { useId } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import {
  useVehicle,
  type VehicleWithSummary,
} from "@/features/vehicle/useVehicles";
import {
  ACCOUNT_NAV_ITEMS,
  GENERAL_NAV_ITEMS,
  VEHICLE_NAV_GROUPS,
  resolveNavItem,
  type NavGroup,
  type NavItem,
} from "@/lib/navigation";
import { SidebarActivityFeed } from "./SidebarActivityFeed";
import { BrandLogo } from "./BrandLogo";
import { NAV_EYEBROW_CLASSNAME } from "./navStyles";
import { useIsAdmin } from "@/features/admin/useIsAdmin";
import { ROUTES } from "@/lib/routes";

const ADMIN_NAV_ITEM: NavItem = { label: "Painel admin", icon: ShieldCheck, to: ROUTES.admin };

type SidebarProps = {
  vehicles: VehicleWithSummary[];
};

/**
 * Ativo não depende só de cor: fundo, peso e um fio de 2px à esquerda no
 * acento — além do `aria-current="page"` que o `NavLink` já põe. Altura de
 * 32px (ponteiro de desktop; a sidebar não existe em tela de toque estreita)
 * pra que, com as 10 seções do veículo, ainda sobre altura pra atividade
 * recente numa tela de 900px.
 */
function NavItemLink({ item, href }: { item: NavItem; href: string }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={href}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "relative flex h-8 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-(--duration-fast)",
          isActive
            ? "bg-state-active font-medium text-text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent"
            : "text-text-secondary hover:bg-state-hover hover:text-text-primary",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-accent")} aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function NavGroupBlock({ group, vehicleId }: { group: NavGroup; vehicleId: string }) {
  const labelId = useId();
  const links = group.items.map((item) => {
    const href = resolveNavItem(item, vehicleId);
    return href ? <NavItemLink key={item.label} item={item} href={href} /> : null;
  });

  if (!group.label) return <div className="flex flex-col gap-0.5">{links}</div>;

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-0.5">
      <p id={labelId} className={cn(NAV_EYEBROW_CLASSNAME, "px-3 pt-2 pb-0.5")}>
        {group.label}
      </p>
      {links}
    </div>
  );
}

/**
 * Etapa 01 do redesign — três blocos separados, mesma ideia da Fase 14b
 * (conta, veículo e configuração não são do mesmo nível):
 * A. destinos gerais ("Minha garagem"), sempre visíveis;
 * B. seções do veículo aberto, com o veículo identificado no topo e os
 *    links agrupados por assunto (Custos/Cuidados/Preparação/Arquivo são
 *    só títulos — todo link continua um clique direto). Sem veículo o
 *    bloco não existe: nada de lista cinza (ADR-049);
 * C. conta e administração, fixos no rodapé.
 *
 * A marca mora aqui no desktop (o cabeçalho só mostra a marca abaixo de
 * `lg`), alinhada à altura do cabeçalho pra os dois fios de baixo casarem.
 */
export function Sidebar({ vehicles }: SidebarProps) {
  const vehicleId = useCurrentVehicleId();
  const { data: isAdmin } = useIsAdmin();
  const { vehicle, isLoading: vehicleLoading } = useVehicle(vehicleId ?? "");
  const vehicleSectionId = useId();

  const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : vehicleLoading ? "Carregando…" : "Veículo";
  const accountItems = isAdmin ? [...ACCOUNT_NAV_ITEMS, ADMIN_NAV_ITEM] : ACCOUNT_NAV_ITEMS;

  return (
    <aside className="hidden h-full min-h-0 w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Link
          to={ROUTES.home}
          aria-label="Slow Garage — ir para Minha garagem"
          className="-mx-1 flex items-center rounded-md px-1 py-1"
        >
          <BrandLogo className="h-11" />
        </Link>
      </div>

      <nav
        aria-label="Navegação principal"
        /*
          Fase 15e: a sidebar é fixa — tem a altura da viewport (o shell é
          `lg:h-dvh`, ver `AppShell`) e "Configurações" fica sempre visível no
          rodapé dela. Quem rola é a lista de atividade (`SidebarActivityFeed`,
          `flex-1 min-h-0` com scroll próprio). O `overflow-y-auto` aqui é só
          rede de segurança pra janela muito baixa, onde nem os links fixos
          cabem: degrada rolando em vez de cortar item.
        */
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3"
      >
        <div className="flex shrink-0 flex-col gap-0.5">
          {GENERAL_NAV_ITEMS.map((item) => {
            const href = resolveNavItem(item, vehicleId);
            return href ? <NavItemLink key={item.label} item={item} href={href} /> : null;
          })}
        </div>

        {vehicleId && (
          <section
            aria-labelledby={vehicleSectionId}
            className="mt-3 flex shrink-0 flex-col gap-0.5 border-t border-border pt-3"
          >
            <div className="px-3 pb-1">
              <p className={NAV_EYEBROW_CLASSNAME}>Veículo aberto</p>
              {/* `p`, não heading: a sidebar vem antes do `h1` da página no DOM e não deve abrir a hierarquia dela. */}
              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                <p
                  id={vehicleSectionId}
                  title={vehicle ? vehicleName : undefined}
                  className="min-w-0 truncate text-sm font-semibold text-text-primary"
                >
                  {vehicleName}
                </p>
                {vehicle?.plate && (
                  <span className="shrink-0 rounded-sm border border-border px-1.5 py-px font-mono text-[11px] tracking-wider text-text-secondary">
                    {vehicle.plate}
                  </span>
                )}
              </div>
            </div>
            {VEHICLE_NAV_GROUPS.map((group) => (
              <NavGroupBlock key={group.label ?? "visao-geral"} group={group} vehicleId={vehicleId} />
            ))}
          </section>
        )}

        <SidebarActivityFeed vehicles={vehicles} />

        <div className="mt-auto flex shrink-0 flex-col gap-0.5 border-t border-border pt-3">
          {accountItems.map((item) => {
            const href = resolveNavItem(item, vehicleId);
            return href ? <NavItemLink key={item.label} item={item} href={href} /> : null;
          })}
        </div>
      </nav>
    </aside>
  );
}
