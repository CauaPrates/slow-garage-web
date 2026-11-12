import { z } from "zod";

/** Mesmo mínimo do Supabase Auth do projeto (`weak_password` em errors.ts); a tela mostra o requisito com este número. */
export const PASSWORD_MIN_LENGTH = 6;

const email = z.string().min(1, "Informe seu e-mail.").email("E-mail inválido.");
const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);

export const signUpSchema = z.object({
  email,
  password,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({
  email,
});
export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

export const updatePasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const displayNameSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(60, "Máximo de 60 caracteres.")
    .optional()
    .or(z.literal("")),
});
export type DisplayNameInput = z.infer<typeof displayNameSchema>;
