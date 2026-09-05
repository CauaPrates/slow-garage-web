import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text-primary">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/icons/icon-192.png" alt="" aria-hidden="true" className="h-7 w-7 rounded-md" />
          <span className="text-sm text-text-secondary">Slow Garage</span>
        </div>
        <ThemeToggle />
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
