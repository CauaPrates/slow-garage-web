import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "../AuthProvider";
import { updatePasswordSchema, type UpdatePasswordInput } from "../schemas";

/** Assume que já existe uma sessão de recuperação válida — quem chama decide isso (ver UpdatePasswordPage). */
export function UpdatePasswordForm() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  async function onSubmit(values: UpdatePasswordInput) {
    setSubmitError(null);
    const { error } = await updatePassword(values.password);
    if (error) {
      setSubmitError(error);
      return;
    }
    navigate(ROUTES.home, { replace: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">Nova senha</Label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirmar nova senha</Label>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        <FieldError>{errors.confirmPassword?.message}</FieldError>
      </div>
      <FieldError>{submitError}</FieldError>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
