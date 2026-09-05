import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { ROUTES, safeRedirectTarget } from "@/lib/routes";
import { useAuth } from "../AuthProvider";
import { signInSchema, type SignInInput } from "../schemas";

export function SignInForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(values: SignInInput) {
    setSubmitError(null);
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setSubmitError(error);
      return;
    }
    navigate(safeRedirectTarget(searchParams.get("redirect")), {
      replace: true,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signin-email">E-mail</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signin-password">Senha</Label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <FieldError>{submitError}</FieldError>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
      <div className="flex flex-col items-center gap-2 text-sm text-text-secondary">
        <Link
          to={ROUTES.recuperarSenha}
          className="text-accent underline underline-offset-2"
        >
          Esqueci minha senha
        </Link>
        <p>
          Não tem conta?{" "}
          <Link
            to={ROUTES.cadastro}
            className="text-accent underline underline-offset-2"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </form>
  );
}
