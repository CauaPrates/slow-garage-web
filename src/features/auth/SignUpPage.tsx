import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignUpForm } from "./components/SignUpForm";

export function SignUpPage() {
  return (
    <AuthLayout title="Criar conta" description="Cadastre um e-mail e uma senha. A conta passa a valer depois que você confirmar o e-mail.">
      <SignUpForm />
    </AuthLayout>
  );
}
