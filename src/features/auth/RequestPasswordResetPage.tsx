import { AuthLayout } from "@/components/layout/AuthLayout";
import { RequestPasswordResetForm } from "./components/RequestPasswordResetForm";
import { useAuthMagazine } from "./components/useAuthMagazine";

export function RequestPasswordResetPage() {
  const magazine = useAuthMagazine();
  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe o e-mail da conta. Enviamos um link para criar uma senha nova."
      {...magazine}
    >
      <RequestPasswordResetForm />
    </AuthLayout>
  );
}
