import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "../AuthProvider";
import { signUpSchema, type SignUpInput } from "../schemas";

export function SignUpForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpInput) {
    setSubmitError(null);
    const { error } = await signUp(values.email, values.password);
    if (error) {
      setSubmitError(error);
      return;
    }
    navigate(ROUTES.confirmeEmail);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">E-mail</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password">Senha</Label>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <FieldError>{submitError}</FieldError>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Criando conta…" : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-text-secondary">
        Já tem conta?{" "}
        <Link
          to={ROUTES.entrar}
          className="text-accent underline underline-offset-2"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
