import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useVehicles } from "@/features/vehicle/useVehicles";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { HeaderAlertsMenu } from "./HeaderAlertsMenu";
import { HeaderActivityMenu } from "./HeaderActivityMenu";
import { HeaderVehicleSwitcher } from "./HeaderVehicleSwitcher";
import { HeaderUserMenu } from "./HeaderUserMenu";

/**
 * Fase 15e: no desktop (`lg`+) o shell tem a altura exata da viewport e não
 * rola — quem rola é o `<main>`. Antes a página inteira rolava e a sidebar,
 * por esticar junto com o conteúdo, empurrava "Configurações" pro fim de uma
 * página de 10.000px. Abaixo de `lg` nada muda: o documento continua rolando
 * (é o que faz a barra de endereço do navegador mobile se esconder, e não há
 * sidebar nesse tamanho pra ficar presa).
 */
export function AppShell() {
  const { data: vehicles } = useVehicles();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text-primary lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
        <Link
          to={ROUTES.home}
          className="flex min-w-0 shrink items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/5 sm:h-11 sm:w-11">
            <img
              src="/icons/icon-192.png"
              alt=""
              aria-hidden="true"
              className="h-6 w-6 rounded-sm sm:h-7 sm:w-7"
            />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-base font-bold tracking-wide text-text-primary uppercase sm:text-lg">
              Slow Garage
            </span>
            <span className="h-0.5 w-8 bg-accent" aria-hidden="true" />
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <HeaderVehicleSwitcher vehicles={vehicles ?? []} />
          <div className="lg:hidden">
            <HeaderActivityMenu vehicles={vehicles ?? []} />
          </div>
          <HeaderAlertsMenu vehicles={vehicles ?? []} />
          <HeaderUserMenu />
        </div>
      </header>
      <div className="flex flex-1 lg:min-h-0">
        <Sidebar vehicles={vehicles ?? []} />
        <main className="min-w-0 flex-1 pb-20 lg:overflow-y-auto lg:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
