import { FunctionsHttpError } from "@supabase/supabase-js";
import { translatePostgresError } from "@/lib/postgresErrors";

/**
 * Toda RPC da Fase 14 (e a Edge Function `admin-invite`) devolve
 * `{ message, code, hint }`. A mensagem de tela sai do `hint` — motivo
 * estável definido pelo backend (docs/API_CONTRACT.md, "Erros das RPCs").
 * O `message` nunca é lido: é texto do servidor, pode mudar a qualquer hora.
 */
const MESSAGE_BY_HINT: Record<string, string> = {
  not_admin: "Você não tem mais acesso ao painel.",
  not_authenticated: "Faça login para continuar.",
  user_not_found: "Usuário não encontrado.",
  invite_not_found: "Convite não encontrado.",
  invite_already_pending: "Essa pessoa já tem um convite pendente.",
  already_admin: "Essa pessoa já é administradora.",
  invite_not_pending: "Esse convite já foi respondido ou cancelado.",
  invite_expired: "Esse convite expirou.",
  inviter_not_admin: "Quem te convidou não é mais administrador.",
  target_not_admin: "Essa pessoa não é administradora.",
  last_admin: "Não é possível remover o último administrador.",
};

/** Erro já normalizado — o que as mutations desta fase lançam quando o servidor recusa. */
export type HintedError = { message: string; code?: string; hint?: string };

export function errorHint(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("hint" in error)) return undefined;
  const hint = (error as { hint: unknown }).hint;
  return typeof hint === "string" ? hint : undefined;
}

/** `true` quando o banco disse que quem chamou não é admin — o painel deve ser fechado na hora. */
export function isNotAdminError(error: unknown): boolean {
  return errorHint(error) === "not_admin";
}

export function translateAdminError(error: unknown): string {
  const hint = errorHint(error);
  if (hint && MESSAGE_BY_HINT[hint]) return MESSAGE_BY_HINT[hint];
  return translatePostgresError(error);
}

/**
 * `functions.invoke` não devolve o corpo do erro direto: um status
 * não-2xx vira `FunctionsHttpError`, com a `Response` original em
 * `context`. Aqui o corpo `{ message, code, hint }` é lido de volta, pra
 * passar pelo mesmo `translateAdminError` das RPCs. `401` (sem sessão)
 * vem do `@supabase/server`, sem `hint` — normalizado para
 * `not_authenticated`.
 */
export async function normalizeFunctionError(error: unknown): Promise<HintedError> {
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    if (response.status === 401) {
      return { message: "unauthorized", hint: "not_authenticated" };
    }
    try {
      const body = (await response.json()) as Partial<HintedError>;
      return { message: body.message ?? error.message, code: body.code, hint: body.hint };
    } catch {
      return { message: error.message };
    }
  }
  return { message: error instanceof Error ? error.message : String(error) };
}
