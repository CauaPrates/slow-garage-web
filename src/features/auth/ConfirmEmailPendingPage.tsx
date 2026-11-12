import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AuthStatusPanel } from "./components/AuthStatusPanel";
import { useAuthMagazine } from "./components/useAuthMagazine";

/**
 * Depois de "Criar conta" — também para e-mail já cadastrado (RN-6 da spec
 * 001). O pedido foi feito; a conta só fica confirmada quando a pessoa abre o
 * link, que traz a sessão (`emailRedirectTo` = /entrar) e leva direto à
 * garagem. Não existe reenvio no produto: a saída é entrar.
 */
export function ConfirmEmailPendingPage() {
  const magazine = useAuthMagazine();
  return (
    <AuthLayout title="Confirme seu e-mail" {...magazine}>
      <AuthStatusPanel
        tone="sent"
        title="Falta confirmar o e-mail"
        action={
          <Link to={ROUTES.entrar} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Já confirmei, ir para Entrar
          </Link>
        }
      >
        <p>
          Enviamos um link de confirmação para o e-mail que você cadastrou. Abra sua caixa de entrada e toque no link
          para ativar a conta.
        </p>
        <p>O link abre a garagem já com a sessão iniciada. Antes de confirmar, entrar com e-mail e senha não funciona.</p>
      </AuthStatusPanel>
    </AuthLayout>
  );
}
