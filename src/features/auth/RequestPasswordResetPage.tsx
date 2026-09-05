import { AuthLayout } from "@/components/layout/AuthLayout";
import { RequestPasswordResetForm } from "./components/RequestPasswordResetForm";

export function RequestPasswordResetPage() {
  return (
    <AuthLayout title="Recuperar senha">
      <RequestPasswordResetForm />
    </AuthLayout>
  );
}
