import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignUpForm } from "./components/SignUpForm";

export function SignUpPage() {
  return (
    <AuthLayout title="Criar conta">
      <SignUpForm />
    </AuthLayout>
  );
}
