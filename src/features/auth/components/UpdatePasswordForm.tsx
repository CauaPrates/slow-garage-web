import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "../AuthProvider";
import { updatePasswordSchema, type UpdatePasswordInput } from "../schemas";
import { PasswordRule, SubmitButton, SubmitError, useGuardedSubmit } from "./AuthFormParts";

/** Assume que já existe uma sessão de recuperação válida — quem chama decide isso (ver UpdatePasswordPage). */
export function UpdatePasswordForm() {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { pending, run } = useGuardedSubmit();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      setSubmitError(null);
      const { error } = await updatePassword(values.password);
      if (error) {
        setSubmitError(error);
        return;
      }
      navigate(ROUTES.home, { replace: true });
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {/* Para o gerenciador de senha saber de qual conta é a senha nova (não aparece nem recebe foco). */}
      {user?.email && <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />}
      <FormField id="new-password" label="Nova senha" hint={<PasswordRule value={password} />} error={errors.password?.message}>
        {(a11y) => <PasswordInput id="new-password" autoComplete="new-password" {...a11y} {...register("password")} />}
      </FormField>
      <FormField id="confirm-password" label="Confirmar nova senha" error={errors.confirmPassword?.message}>
        {(a11y) => <PasswordInput id="confirm-password" autoComplete="new-password" {...a11y} {...register("confirmPassword")} />}
      </FormField>
      <SubmitError>{submitError}</SubmitError>
      <SubmitButton pending={pending} label="Salvar nova senha" pendingLabel="Salvando…" className="mt-1 w-full" />
    </form>
  );
}
