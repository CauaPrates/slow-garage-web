import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { ROUTES } from "@/lib/routes";

/** Redireciona quem não está logado pra /entrar, guardando a rota original em ?redirect=. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-sm text-text-secondary">
        Carregando…
      </div>
    );
  }

  if (status === "unauthenticated") {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.entrar}?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
