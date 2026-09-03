import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text-primary">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm text-text-secondary">Slow Garage</span>
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
