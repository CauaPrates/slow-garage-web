import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "./AuthProvider";
import { UpdatePasswordForm } from "./components/UpdatePasswordForm";

export function UpdatePasswordPage() {
  const { status, isPasswordRecovery } = useAuth();

  if (status === "loading") {
    return (
      <AuthLayout title="Redefinir senha">
        <p className="text-sm text-text-secondary">Verificando o link…</p>
      </AuthLayout>
    );
  }

  if (!isPasswordRecovery) {
    return (
      <AuthLayout title="Redefinir senha">
        <div className="flex flex-col gap-4 text-sm text-text-secondary">
          <p>Este link expirou ou já foi usado.</p>
          <Link
            to={ROUTES.recuperarSenha}
            className="text-accent underline underline-offset-2"
          >
            Pedir um novo link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Redefinir senha">
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
