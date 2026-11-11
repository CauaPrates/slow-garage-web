import { AuthLayout } from "@/components/layout/AuthLayout";
import { RequestPasswordResetForm } from "./components/RequestPasswordResetForm";

export function RequestPasswordResetPage() {
  return (
    <AuthLayout title="Recuperar senha" description="Informe o e-mail da conta. Enviamos um link para criar uma senha nova.">
      <RequestPasswordResetForm />
    </AuthLayout>
  );
}
