import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignInForm } from "./components/SignInForm";
import { useAuthMagazine } from "./components/useAuthMagazine";

/** Login com a revista da Edição 01 (ADR-104): coluna editorial no desktop, fundo escurecido no celular. */
export function SignInPage() {
  const magazine = useAuthMagazine();
  return (
    <AuthLayout title="Entrar" description="Use o e-mail e a senha da sua conta." {...magazine}>
      <SignInForm />
    </AuthLayout>
  );
}
