import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ROUTES } from "@/lib/routes";

export function ConfirmEmailPendingPage() {
  return (
    <AuthLayout title="Confirme seu e-mail">
      <div className="flex flex-col gap-4 text-sm text-text-secondary">
        <p>
          Enviamos um link de confirmação pro e-mail que você cadastrou. Abra
          sua caixa de entrada e clique no link pra ativar sua conta.
        </p>
        <Link
          to={ROUTES.entrar}
          className="text-accent underline underline-offset-2"
        >
          Já confirmei, ir pra entrar
        </Link>
      </div>
    </AuthLayout>
  );
}
