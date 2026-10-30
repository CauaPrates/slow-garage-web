import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useVehicles } from "@/features/vehicle/useVehicles";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { BrandLogo } from "./BrandLogo";
import { HeaderAlertsMenu } from "./HeaderAlertsMenu";
import { HeaderActivityMenu } from "./HeaderActivityMenu";
import { HeaderVehicleSwitcher } from "./HeaderVehicleSwitcher";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { HeaderNotificationsMenu } from "./HeaderNotificationsMenu";
import { RouteNotice } from "./RouteNotice";

/**
 * Fase 15e: no desktop (`lg`+) o shell tem a altura exata da viewport e não
 * rola — quem rola é o `<main>`. Antes a página inteira rolava e a sidebar,
 * por esticar junto com o conteúdo, empurrava "Configurações" pro fim de uma
 * página de 10.000px. Abaixo de `lg` nada muda: o documento continua rolando
 * (é o que faz a barra de endereço do navegador mobile se esconder, e não há
 * sidebar nesse tamanho pra ficar presa).
 *
 * Etapa 01 do redesign: a sidebar passa a ocupar a altura toda, com a marca
 * no topo dela; o cabeçalho fica só sobre a coluna de conteúdo e vira uma
 * barra sólida de contexto + utilitários (sem vidro, brilho nem shimmer). A
 * marca aparece num lugar só por vez: na sidebar a partir de `lg`, no
 * cabeçalho abaixo disso.
 */
export function AppShell() {
  const { data: vehicles } = useVehicles();
  const vehicleList = vehicles ?? [];

  return (
    <div className="flex min-h-dvh bg-bg text-text-primary lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <Sidebar vehicles={vehicleList} />

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
        {/* z-20: abaixo do z-30 da BottomNav e do z-50 de popover/diálogo. */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-bg px-2 sm:h-16 sm:gap-3 sm:px-6">
          <Link
            to={ROUTES.home}
            aria-label="Slow Garage — ir para Minha garagem"
            className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-md lg:hidden"
          >
            <BrandLogo variant="symbol" className="h-8 sm:hidden" />
            <BrandLogo className="hidden h-10 sm:block" />
          </Link>

          <div className="flex min-w-0 flex-1 items-center">
            <HeaderVehicleSwitcher vehicles={vehicleList} />
          </div>

          <div className="flex shrink-0 items-center sm:gap-1">
            {/* No desktop a atividade recente mora na sidebar (`SidebarActivityFeed`). */}
            <div className="lg:hidden">
              <HeaderActivityMenu vehicles={vehicleList} />
            </div>
            <HeaderNotificationsMenu />
            <HeaderAlertsMenu vehicles={vehicleList} />
            <span className="mx-1.5 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <HeaderUserMenu />
          </div>
        </header>

        {/* Folga de baixo = altura da BottomNav + safe area: o último conteúdo da página nunca fica embaixo da barra. */}
        <main className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:overflow-y-auto lg:pb-0">
          <RouteNotice />
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
