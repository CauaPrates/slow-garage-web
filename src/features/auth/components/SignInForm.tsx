import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form";
import { textLinkClassName } from "@/components/ui/text-link";
import { AuthAlternate } from "@/components/layout/AuthLayout";
import { ROUTES, safeRedirectTarget } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "../AuthProvider";
import { signInSchema, type SignInInput } from "../schemas";
import { EMAIL_FIELD_PROPS, SubmitButton, SubmitError, useGuardedSubmit } from "./AuthFormParts";

export function SignInForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { pending, run } = useGuardedSubmit();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      setSubmitError(null);
      const { error } = await signIn(values.email, values.password);
      if (error) {
        // E-mail e senha continuam no formulário: a pessoa corrige o que errou e envia de novo.
        setSubmitError(error);
        return;
      }
      navigate(safeRedirectTarget(searchParams.get("redirect")), { replace: true });
    }),
  );

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField id="signin-email" label="E-mail" error={errors.email?.message}>
          {(a11y) => <Input id="signin-email" autoComplete="username" {...EMAIL_FIELD_PROPS} {...a11y} {...register("email")} />}
        </FormField>
        <FormField id="signin-password" label="Senha" error={errors.password?.message}>
          {(a11y) => <PasswordInput id="signin-password" autoComplete="current-password" {...a11y} {...register("password")} />}
        </FormField>
        <SubmitError>{submitError}</SubmitError>
        <SubmitButton pending={pending} label="Entrar" pendingLabel="Entrando…" className="mt-1 w-full" />
        <Link to={ROUTES.recuperarSenha} className={cn(textLinkClassName(), "self-center")}>
          Esqueci minha senha
        </Link>
      </form>
      <AuthAlternate question="Ainda não tem conta?" to={ROUTES.cadastro} label="Criar conta" />
    </>
  );
}
