/**
 * Depois de um deploy, o navegador de quem já tinha a aba aberta ainda
 * referencia os hashes de chunk antigos (Fase 10 — página por chunk sob
 * demanda); esses arquivos somem do Vercel no deploy seguinte, e o
 * import dinâmico da rota falha com essa mensagem (varia por navegador).
 * Recarregar a página busca o `index.html` novo, que aponta pros hashes
 * certos — resolve sozinho na maioria dos casos, sem exigir ação do
 * usuário além do que já ia acontecer na próxima visita.
 */
const CHUNK_ERROR_PATTERN =
  /dynamically imported module|failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return CHUNK_ERROR_PATTERN.test(message);
}

const RELOAD_FLAG_KEY = "slow-garage:chunk-reload-attempted";

/**
 * Só recarrega uma vez por sessão de aba: se o reload não resolver (ex.:
 * rede fora do ar, não só deploy novo), a segunda falha cai na tela de
 * erro de verdade em vez de entrar num loop de reload infinito.
 */
export function reloadOnceForChunkError(): void {
  if (sessionStorage.getItem(RELOAD_FLAG_KEY) === "1") return;
  sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
  window.location.reload();
}

export function clearChunkReloadFlag(): void {
  sessionStorage.removeItem(RELOAD_FLAG_KEY);
}
