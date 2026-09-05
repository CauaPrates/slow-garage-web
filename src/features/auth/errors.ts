import { isAuthError } from "@supabase/supabase-js";

const MESSAGES_BY_CODE: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_exists: "Este e-mail já está cadastrado.",
  user_already_exists: "Este e-mail já está cadastrado.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  weak_password: "A senha precisa ter pelo menos 6 caracteres.",
  over_request_rate_limit: "Muitas tentativas. Aguarde um pouco e tente de novo.",
  over_email_send_rate_limit:
    "Muitas tentativas. Aguarde um pouco e tente de novo.",
  same_password: "A nova senha precisa ser diferente da atual.",
  otp_expired: "Este link expirou. Peça um novo.",
  session_not_found: "Sua sessão expirou. Entre de novo.",
  user_not_found: "E-mail ou senha incorretos.",
  email_address_invalid: "Este endereço de e-mail não é válido.",
  email_address_not_authorized: "Este e-mail não pode se cadastrar.",
};

const FALLBACK_MESSAGE =
  "Não foi possível completar a ação. Verifique sua conexão e tente de novo.";

/** Traduz erro do Supabase Auth pro português — nunca deixa a mensagem crua chegar na tela. */
export function translateAuthError(error: unknown): string {
  if (isAuthError(error)) {
    if (error.code && MESSAGES_BY_CODE[error.code]) {
      return MESSAGES_BY_CODE[error.code];
    }
    // Sem `code` (erro mais antigo/sem HTTP) — melhor esforço pela mensagem.
    if (/invalid login credentials/i.test(error.message)) {
      return MESSAGES_BY_CODE.invalid_credentials;
    }
    if (/already registered|already exists/i.test(error.message)) {
      return MESSAGES_BY_CODE.email_exists;
    }
    if (/email not confirmed/i.test(error.message)) {
      return MESSAGES_BY_CODE.email_not_confirmed;
    }
  }
  return FALLBACK_MESSAGE;
}
