import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text-primary">
      <header className="flex items-center border-b border-border px-4 py-3">
        <Link to={ROUTES.home} className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/5">
            <img src="/icons/icon-192.png" alt="" aria-hidden="true" className="h-7 w-7 rounded-sm" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-lg font-bold tracking-wide text-text-primary uppercase">
              Slow Garage
            </span>
            <span className="h-0.5 w-8 bg-accent" aria-hidden="true" />
          </span>
        </Link>
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
