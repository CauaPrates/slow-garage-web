import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignUpForm } from "./components/SignUpForm";
import { useAuthMagazine } from "./components/useAuthMagazine";

/** Cadastro com a mesma revista do login (ADR-104): coluna editorial no desktop, fundo escurecido no celular. */
export function SignUpPage() {
  const magazine = useAuthMagazine();
  return (
    <AuthLayout
      title="Criar conta"
      description="Cadastre um e-mail e uma senha. A conta passa a valer depois que você confirmar o e-mail."
      {...magazine}
    >
      <SignUpForm />
    </AuthLayout>
  );
}
