import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { safeRedirectTarget } from "@/lib/routes";

/**
 * Redireciona quem já está logado pra longe de /entrar, /cadastro etc.
 * Lê o mesmo `?redirect=` que o SignInForm usa — se os dois discordarem
 * de destino, um sobrescreve a navegação do outro na mesma renderização.
 */
export function GuestRoute() {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-sm text-text-secondary">
        Carregando…
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <Navigate to={safeRedirectTarget(searchParams.get("redirect"))} replace />
    );
  }

  return <Outlet />;
}
