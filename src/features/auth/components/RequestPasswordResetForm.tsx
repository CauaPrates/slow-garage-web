import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form";
import { AuthAlternate } from "@/components/layout/AuthLayout";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "../AuthProvider";
import { requestPasswordResetSchema, type RequestPasswordResetInput } from "../schemas";
import { EMAIL_FIELD_PROPS, SubmitButton, SubmitError, useGuardedSubmit } from "./AuthFormParts";
import { AuthStatusPanel } from "./AuthStatusPanel";

export function RequestPasswordResetForm() {
  const { requestPasswordReset } = useAuth();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { pending, run } = useGuardedSubmit();
  const sentTitleRef = useRef<HTMLHeadingElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
  });

  // O formulário some quando o pedido vai: o foco vai pro aviso, senão cairia no <body>.
  useEffect(() => {
    if (sentTo) sentTitleRef.current?.focus();
  }, [sentTo]);

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      setSubmitError(null);
      const { error } = await requestPasswordReset(values.email);
      if (error) {
        setSubmitError(error);
        return;
      }
      setSentTo(values.email);
    }),
  );

  if (sentTo) {
    return (
      <>
        {/* RN-4 da spec 001: a mesma frase exista ou não uma conta com o e-mail. */}
        <AuthStatusPanel tone="sent" title="Pedido enviado" titleRef={sentTitleRef}>
          <p>
            Se <span className="font-medium break-all text-text-primary">{sentTo}</span> tiver uma conta, enviamos um
            link de recuperação. Confira sua caixa de entrada.
          </p>
          <p>O link abre a tela de nova senha. Se ele vencer, peça outro aqui.</p>
        </AuthStatusPanel>
        <AuthAlternate question="Lembrou a senha?" to={ROUTES.entrar} label="Voltar para Entrar" />
      </>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField id="reset-email" label="E-mail" error={errors.email?.message}>
          {(a11y) => <Input id="reset-email" autoComplete="email" {...EMAIL_FIELD_PROPS} {...a11y} {...register("email")} />}
        </FormField>
        <SubmitError>{submitError}</SubmitError>
        <SubmitButton pending={pending} label="Enviar link de recuperação" pendingLabel="Enviando…" className="mt-1 w-full" />
      </form>
      <AuthAlternate question="Lembrou a senha?" to={ROUTES.entrar} label="Voltar para Entrar" />
    </>
  );
}
