import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignInForm } from "./components/SignInForm";

export function SignInPage() {
  return (
    <AuthLayout title="Entrar">
      <SignInForm />
    </AuthLayout>
  );
}
