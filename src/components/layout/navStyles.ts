/** Rótulo de grupo/seção da navegação (sidebar, folhas): o papel de sobrelinha, o mesmo da faixa de resumo. Nunca link. */
export const NAV_EYEBROW_CLASSNAME = "type-overline text-text-secondary";

/** Botão de ícone do cabeçalho (atividade, notificações, alertas) — 44px, neutro, marcado enquanto o popover está aberto. */
export const HEADER_ICON_BUTTON_CLASSNAME =
  "relative text-text-secondary hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary";

/**
 * Etapa 15 — popover do cabeçalho com lista (alertas, notificações, atividade):
 * nunca passa da altura que sobra na tela (o Radix mede e expõe na variável),
 * nem de 40rem num monitor alto. Cabeçalho e rodapé do popover ficam fixos; só
 * a lista rola (`HEADER_POPOVER_LIST_CLASSNAME`). Antes, em 320×640, a caixa de
 * entrada passava do fim da tela e o rodapé ("Meus convites") ficava fora.
 */
export const HEADER_POPOVER_CLASSNAME =
  "flex w-96 max-h-[min(var(--radix-popover-content-available-height),40rem)] flex-col";

/**
 * A lista rolável dentro do popover. `overscroll-contain`: chegar ao fim da
 * lista (roda do mouse, toque, teclado) não passa a rolar a página por trás —
 * antes a roda rolava a página e o último item nunca chegava à vista.
 */
export const HEADER_POPOVER_LIST_CLASSNAME = "min-h-0 flex-1 overflow-y-auto overscroll-contain";

/** Contador sobre o ícone. O anel na cor do fundo separa o selo do ícone sem sombra nem brilho. */
export const HEADER_BADGE_CLASSNAME =
  "absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ring-2 ring-bg";
