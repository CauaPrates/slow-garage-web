/**
 * Objeto de rotas tipado — nenhuma string de rota deve aparecer solta
 * em componente. Fases seguintes estendem este objeto conforme criam
 * telas de domínio (ex: `vehicle: (id: string) => \`/v/${id}\``).
 */
export const ROUTES = {
  home: "/",
  entrar: "/entrar",
  cadastro: "/cadastro",
  confirmeEmail: "/confirme-seu-email",
  recuperarSenha: "/recuperar-senha",
  redefinirSenha: "/redefinir-senha",
  configuracoes: "/configuracoes",
  vehicle: (vehicleId: string) => `/v/${vehicleId}`,
} as const;

/**
 * Valida o `?redirect=` usado por `/entrar` — só aceita caminho interno,
 * nunca URL absoluta (evita open redirect). Usado tanto pelo SignInForm
 * (pra onde ir depois de logar) quanto pelo GuestRoute (pra onde mandar
 * quem já está logado e tenta abrir /entrar de novo) — os dois precisam
 * concordar no mesmo destino, senão um redireciona por cima do outro.
 */
export function safeRedirectTarget(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return ROUTES.home;
}
