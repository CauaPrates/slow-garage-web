import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/**
 * Shell vazio da Fase 0 — sidebar desktop e bottom nav mobile são
 * da Fase 3 (003-vehicle-shell). Aqui só existe o cromo mínimo para
 * provar que tema, roteamento e providers funcionam.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text-primary">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm text-text-secondary">Slow Garage</span>
        <ThemeToggle />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
