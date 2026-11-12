import { Link } from "react-router-dom";
import { AuthAlternate, AuthLayout } from "@/components/layout/AuthLayout";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { AuthStatusPanel } from "./components/AuthStatusPanel";
import { UpdatePasswordForm } from "./components/UpdatePasswordForm";
import { useAuthMagazine } from "./components/useAuthMagazine";

/**
 * Destino do link de recuperação (`redirectTo` de `requestPasswordReset`).
 * Só mostra o formulário com a sessão de recuperação (`PASSWORD_RECOVERY`);
 * sem ela — link vencido, já usado ou aberto sem link — o tratamento de
 * antes: a mesma mensagem e "Pedir um novo link".
 */
export function UpdatePasswordPage() {
  const { status, isPasswordRecovery } = useAuth();
  // Mesma posição nos três estados: a revista continua de onde estava quando o link termina de ser verificado.
  const magazine = useAuthMagazine();

  if (status === "loading") {
    return (
      <AuthLayout title="Redefinir senha" {...magazine}>
        <AuthStatusPanel tone="loading" title="Verificando o link…" />
      </AuthLayout>
    );
  }

  if (!isPasswordRecovery) {
    return (
      <AuthLayout title="Redefinir senha" {...magazine}>
        <AuthStatusPanel
          tone="error"
          title="Este link expirou ou já foi usado."
          action={
            <Link to={ROUTES.recuperarSenha} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Pedir um novo link
            </Link>
          }
        >
          <p>Cada link de recuperação vale uma vez. Peça outro com o mesmo e-mail.</p>
        </AuthStatusPanel>
        <AuthAlternate question="Lembrou a senha?" to={ROUTES.entrar} label="Voltar para Entrar" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Redefinir senha"
      description="Escolha a senha nova da sua conta. Depois de salvar, você entra direto na garagem."
      {...magazine}
    >
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
