import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form";
import { useAuth } from "../AuthProvider";
import { updatePasswordSchema, type UpdatePasswordInput } from "../schemas";
import { PasswordRule, SubmitButton, SubmitError, useGuardedSubmit } from "./AuthFormParts";

/** Mesmo schema/`updatePassword` do fluxo de recuperação (`UpdatePasswordForm`) — a diferença é só o contexto: aqui a sessão já é a do próprio usuário logado, então fica na página em vez de navegar embora. */
export function ChangePasswordForm() {
  const { user, updatePassword } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { pending, run } = useGuardedSubmit();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      setSubmitError(null);
      setSaved(false);
      const { error } = await updatePassword(values.password);
      if (error) {
        setSubmitError(error);
        return;
      }
      reset();
      setSaved(true);
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {/* Para o gerenciador de senha associar a senha nova à conta (não aparece nem recebe foco). */}
      {user?.email && <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />}
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
        <FormField
          id="settings-new-password"
          label="Nova senha"
          hint={<PasswordRule value={password} />}
          error={errors.password?.message}
        >
          {(a11y) => <PasswordInput id="settings-new-password" autoComplete="new-password" {...a11y} {...register("password")} />}
        </FormField>
        <FormField id="settings-confirm-password" label="Confirmar nova senha" error={errors.confirmPassword?.message}>
          {(a11y) => (
            <PasswordInput id="settings-confirm-password" autoComplete="new-password" {...a11y} {...register("confirmPassword")} />
          )}
        </FormField>
      </div>
      <SubmitError>{submitError}</SubmitError>
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <p role="status" className="type-caption mr-auto text-text-secondary">
          {saved ? "Senha alterada. Use a nova no próximo login." : ""}
        </p>
        <SubmitButton pending={pending} label="Salvar nova senha" pendingLabel="Salvando…" variant="outline" />
      </div>
    </form>
  );
}
