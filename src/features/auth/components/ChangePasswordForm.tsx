import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { useAuth } from "../AuthProvider";
import { updatePasswordSchema, type UpdatePasswordInput } from "../schemas";

/** Mesmo schema/`updatePassword` do fluxo de recuperação (`UpdatePasswordForm`) — a diferença é só o contexto: aqui a sessão já é a do próprio usuário logado, então fica na página em vez de navegar embora. */
export function ChangePasswordForm() {
  const { updatePassword } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });

  async function onSubmit(values: UpdatePasswordInput) {
    setSubmitError(null);
    setSaved(false);
    const { error } = await updatePassword(values.password);
    if (error) {
      setSubmitError(error);
      return;
    }
    reset();
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-new-password">Nova senha</Label>
        <Input
          id="settings-new-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-confirm-password">Confirmar nova senha</Label>
        <Input
          id="settings-confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        <FieldError>{errors.confirmPassword?.message}</FieldError>
      </div>
      <FieldError>{submitError}</FieldError>
      {saved && (
        <p role="status" aria-live="polite" className="text-sm text-success">
          Senha alterada.
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
