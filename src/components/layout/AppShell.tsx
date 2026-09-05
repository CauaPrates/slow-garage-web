import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useVehicles } from "@/features/vehicle/useVehicles";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { HeaderAlertsMenu } from "./HeaderAlertsMenu";
import { HeaderActivityMenu } from "./HeaderActivityMenu";
import { HeaderVehicleSwitcher } from "./HeaderVehicleSwitcher";
import { HeaderUserMenu } from "./HeaderUserMenu";

export function AppShell() {
  const { data: vehicles } = useVehicles();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text-primary">
      <header className="flex items-center justify-between border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
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
          <HeaderActivityMenu vehicles={vehicles ?? []} />
          <HeaderAlertsMenu vehicles={vehicles ?? []} />
          <HeaderUserMenu />
        </div>
      </header>
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
