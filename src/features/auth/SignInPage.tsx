import { AuthLayout } from "@/components/layout/AuthLayout";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { LoginMagazine } from "./components/LoginMagazine";
import { SignInForm } from "./components/SignInForm";

/** `lg` (64rem) — o mesmo corte em que o `AuthLayout` mostra a coluna editorial. */
const EDITORIAL_QUERY = "(min-width: 64rem)";

export function SignInPage() {
  // Só monta a revista onde a coluna aparece: no celular e no tablet nenhuma imagem dela é baixada.
  const showEditorial = useMediaQuery(EDITORIAL_QUERY);
  return (
    <AuthLayout
      title="Entrar"
      description="Use o e-mail e a senha da sua conta."
      editorial={showEditorial ? <LoginMagazine /> : undefined}
    >
      <SignInForm />
    </AuthLayout>
  );
}
