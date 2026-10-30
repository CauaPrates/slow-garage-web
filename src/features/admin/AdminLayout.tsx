import { useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteNoticeState } from "@/components/layout/RouteNotice";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "./useIsAdmin";

const ADMIN_TABS = [
  { label: "Visão geral", to: ROUTES.admin, end: true },
  { label: "Usuários", to: ROUTES.adminUsers, end: false },
  { label: "Convites", to: ROUTES.adminInvites, end: false },
  { label: "Log de auditoria", to: ROUTES.adminAudit, end: false },
] as const;

/**
 * Guard + navegação do painel (`/admin/*`). Rechecka `is_admin()` ao
 * entrar (a query não tem cache longo — ver `useIsAdmin`) e tira do
 * painel quando o valor vira `false`: acesso pela URL de quem é
 * gearhead, 403 `not_admin` de qualquer RPC (`Providers`), ou a
 * notificação `admin_role_revoked` chegando em tempo real.
 *
 * Isso é UX. A segurança é do banco: toda RPC admin recusa quem não é
 * admin, com ou sem esta tela.
 */
export function AdminLayout() {
  const isAdminQuery = useIsAdmin();
  const navigate = useNavigate();
  const wasAdmin = useRef(false);
  const isAdmin = isAdminQuery.data;

  useEffect(() => {
    if (isAdmin === true) {
      wasAdmin.current = true;
      return;
    }
    if (isAdmin === false) {
      const state: RouteNoticeState = {
        notice: wasAdmin.current
          ? "Você não tem mais acesso ao painel."
          : "O painel é só para administradores.",
      };
      navigate(ROUTES.home, { replace: true, state });
    }
  }, [isAdmin, navigate]);

  if (isAdminQuery.isError && isAdmin === undefined) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível confirmar seu acesso ao painel.</p>
        <Button variant="ghost" onClick={() => isAdminQuery.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (isAdmin !== true) {
    return (
      <div className="flex flex-col gap-4 p-6" aria-busy="true">
        <span className="sr-only">Conferindo acesso ao painel…</span>
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  return (
    // `relative`: todo `sr-only` (absoluto) do painel fica preso aqui dentro.
    // Sem ancestral posicionado ele escapava do <main> e fazia a página
    // inteira rolar no desktop, levando o header junto.
    <div className="relative flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs tracking-wide text-text-secondary uppercase">Painel admin</p>
        {/* Mobile: grade 2×2 com as 4 seções visíveis — a fileira com rolagem lateral cortava "Log de auditoria" e parecia quebrada. */}
        <nav aria-label="Seções do painel" className="grid grid-cols-2 gap-2 sm:flex sm:gap-1">
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center justify-center rounded-md border px-3 text-sm whitespace-nowrap transition-colors duration-150 sm:shrink-0",
                  isActive
                    ? "border-accent/40 bg-accent/10 font-medium text-accent"
                    : "border-border text-text-secondary hover:text-text-primary",
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
