import { useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import type { RouteNoticeState } from "@/components/layout/RouteNotice";
import { PageError } from "@/components/ui/feedback";
import { Skeleton } from "@/components/ui/skeleton";
import { useRetryFocus } from "@/hooks/useRetryFocus";
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
 *
 * Etapa 16: a casca comum das telas de gestão (`Page`, margens e vãos por
 * token); sobrelinha "Painel admin" e as quatro seções como navegação —
 * grade 2×2 no celular (as quatro à vista, nenhuma cortada) e, do `sm` pra
 * cima, abas com o fio laranja embaixo da atual (`aria-current="page"`,
 * posto pelo `NavLink`). Conferindo acesso e falha usam `Skeleton` e
 * `PageError` comuns.
 */
export function AdminLayout() {
  const isAdminQuery = useIsAdmin();
  const navigate = useNavigate();
  const wasAdmin = useRef(false);
  const isAdmin = isAdminQuery.data;
  // Depois de "Tentar de novo" com sucesso, o foco vai para o topo do painel (antes caía no <body>).
  const topRef = useRef<HTMLDivElement>(null);
  const retry = useRetryFocus(isAdminQuery.dataUpdatedAt, topRef);

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
      <Page>
        <PageError message="Não foi possível confirmar seu acesso ao painel." onRetry={() => retry(isAdminQuery.refetch)} />
      </Page>
    );
  }

  if (isAdmin !== true) {
    return (
      <Page aria-busy="true">
        <span className="sr-only">Conferindo acesso ao painel…</span>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-11 w-full max-w-xl" />
        <Skeleton className="h-40" />
      </Page>
    );
  }

  return (
    // `relative`: todo `sr-only` (absoluto) do painel fica preso aqui dentro.
    // Sem ancestral posicionado ele escapava do <main> e fazia a página
    // inteira rolar no desktop, levando o header junto.
    <Page className="relative">
      <div ref={topRef} tabIndex={-1} className="flex flex-col gap-2 rounded-md outline-offset-4">
        <p className="type-overline text-text-secondary">Painel admin</p>
        <nav aria-label="Seções do painel">
          <ul className="grid grid-cols-2 gap-2 sm:flex sm:gap-1 sm:border-b sm:border-border">
            {ADMIN_TABS.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-control items-center justify-center rounded-md border px-3 text-sm whitespace-nowrap transition-colors duration-(--duration-fast)",
                      "sm:-mb-px sm:rounded-none sm:rounded-t-md sm:border-0 sm:border-b-2 sm:px-3",
                      isActive
                        ? "border-accent/50 bg-accent/10 font-semibold text-text-primary sm:border-accent sm:bg-transparent"
                        : "border-border text-text-secondary hover:bg-state-hover hover:text-text-primary sm:border-transparent",
                    )
                  }
                >
                  {tab.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <Outlet />
    </Page>
  );
}
