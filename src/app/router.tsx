import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { GuestRoute } from "@/components/shared/GuestRoute";
import { RouteFallback } from "@/components/shared/RouteFallback";
import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { ROUTES } from "@/lib/routes";
import { clearChunkReloadFlag, isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunk-error";

/**
 * Cada página vira o próprio chunk JS, baixado só quando a rota é
 * visitada — antes desta fase, tudo (login, timeline, gráficos,
 * documentos...) ia num punhado de chunks grandes carregados de uma vez
 * só, mesmo pra quem só queria fazer login (Fase 10, medido com
 * Lighthouse: ~198KiB de JS sem uso na tela de login, a maior parte do
 * atraso de LCP era tempo de execução desse JS que a tela nem usa).
 *
 * Fase 029: se o import do chunk falhar por deploy novo (hash antigo
 * sumiu do Vercel — ver `RouteErrorBoundary`), tenta recarregar a
 * página uma vez antes de deixar o erro chegar no `errorElement`.
 */
function lazyPage(loader: () => Promise<Record<string, ComponentType>>, name: string) {
  const Component = lazy(async () => {
    try {
      const mod = await loader();
      clearChunkReloadFlag();
      return { default: mod[name] };
    } catch (error) {
      if (isChunkLoadError(error)) {
        reloadOnceForChunkError();
      }
      throw error;
    }
  });
  return (
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    id: "root",
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.home,
            element: <AppShell />,
            children: [
              {
                index: true,
                element: lazyPage(() => import("@/features/vehicle/VehicleListPage"), "VehicleListPage"),
              },
              {
                path: "configuracoes",
                element: lazyPage(() => import("@/features/auth/SettingsPage"), "SettingsPage"),
              },
              {
                path: "v/:vehicleId",
                element: lazyPage(() => import("@/features/vehicle/VehiclePage"), "VehiclePage"),
              },
              {
                path: "v/:vehicleId/gastos",
                element: lazyPage(() => import("@/features/expense/ExpensesPage"), "ExpensesPage"),
              },
              {
                path: "v/:vehicleId/abastecimentos",
                element: lazyPage(() => import("@/features/fuel/FuelLogsPage"), "FuelLogsPage"),
              },
              {
                path: "v/:vehicleId/manutencao",
                element: lazyPage(
                  () => import("@/features/maintenance/MaintenancePage"),
                  "MaintenancePage",
                ),
              },
              {
                path: "v/:vehicleId/problemas",
                element: lazyPage(() => import("@/features/issue/IssuesPage"), "IssuesPage"),
              },
              {
                path: "v/:vehicleId/projetos",
                element: lazyPage(() => import("@/features/project/ProjectsPage"), "ProjectsPage"),
              },
              {
                path: "v/:vehicleId/projetos/:projectId",
                element: lazyPage(
                  () => import("@/features/project/ProjectDetailPage"),
                  "ProjectDetailPage",
                ),
              },
              {
                path: "v/:vehicleId/documentos",
                element: lazyPage(() => import("@/features/document/DocumentsPage"), "DocumentsPage"),
              },
              {
                path: "v/:vehicleId/fotos",
                element: lazyPage(() => import("@/features/photo/PhotosPage"), "PhotosPage"),
              },
              {
                path: "v/:vehicleId/historico",
                element: lazyPage(() => import("@/features/timeline/TimelinePage"), "TimelinePage"),
              },
            ],
          },
        ],
      },
      {
        element: <GuestRoute />,
        children: [
          {
            path: ROUTES.entrar,
            element: lazyPage(() => import("@/features/auth/SignInPage"), "SignInPage"),
          },
          {
            path: ROUTES.cadastro,
            element: lazyPage(() => import("@/features/auth/SignUpPage"), "SignUpPage"),
          },
          {
            path: ROUTES.recuperarSenha,
            element: lazyPage(
              () => import("@/features/auth/RequestPasswordResetPage"),
              "RequestPasswordResetPage",
            ),
          },
        ],
      },
      {
        path: ROUTES.confirmeEmail,
        element: lazyPage(
          () => import("@/features/auth/ConfirmEmailPendingPage"),
          "ConfirmEmailPendingPage",
        ),
      },
      {
        path: ROUTES.redefinirSenha,
        element: lazyPage(() => import("@/features/auth/UpdatePasswordPage"), "UpdatePasswordPage"),
      },
    ],
  },
]);
