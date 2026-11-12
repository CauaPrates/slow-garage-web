import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form";
import { AuthAlternate } from "@/components/layout/AuthLayout";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "../AuthProvider";
import { signUpSchema, type SignUpInput } from "../schemas";
import { EMAIL_FIELD_PROPS, PasswordRule, SubmitButton, SubmitError, useGuardedSubmit } from "./AuthFormParts";

export function SignUpForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { pending, run } = useGuardedSubmit();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      setSubmitError(null);
      const { error } = await signUp(values.email, values.password);
      if (error) {
        setSubmitError(error);
        return;
      }
      // Mesma tela para e-mail novo e já cadastrado (RN-6 da spec 001: o cadastro nunca revela se o e-mail existe).
      navigate(ROUTES.confirmeEmail);
    }),
  );

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField id="signup-email" label="E-mail" hint="Enviamos o link de confirmação para ele." error={errors.email?.message}>
          {(a11y) => <Input id="signup-email" autoComplete="email" {...EMAIL_FIELD_PROPS} {...a11y} {...register("email")} />}
        </FormField>
        <FormField
          id="signup-password"
          label="Senha"
          hint={<PasswordRule value={password} />}
          error={errors.password?.message}
        >
          {(a11y) => <PasswordInput id="signup-password" autoComplete="new-password" {...a11y} {...register("password")} />}
        </FormField>
        <SubmitError>{submitError}</SubmitError>
        <SubmitButton pending={pending} label="Criar conta" pendingLabel="Criando conta…" className="mt-1 w-full" />
      </form>
      <AuthAlternate question="Já tem conta?" to={ROUTES.entrar} label="Entrar" />
    </>
  );
}
