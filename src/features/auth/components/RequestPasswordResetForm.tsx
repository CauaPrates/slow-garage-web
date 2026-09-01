import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { useAuth } from "../AuthProvider";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "../schemas";

export function RequestPasswordResetForm() {
  const { requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
  });

  async function onSubmit(values: RequestPasswordResetInput) {
    setSubmitError(null);
    const { error } = await requestPasswordReset(values.email);
    if (error) {
      setSubmitError(error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p role="status" className="text-sm text-text-secondary">
        Se esse e-mail tiver uma conta, enviamos um link de recuperação.
        Confira sua caixa de entrada.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-email">E-mail</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <FieldError>{submitError}</FieldError>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar link de recuperação"}
      </Button>
    </form>
  );
}
