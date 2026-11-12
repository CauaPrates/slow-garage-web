/**
 * "Tentar de novo" some quando a nova tentativa dá certo (o aviso vira a
 * grade; o quadro da foto vira a foto): depois da consulta, se o foco caiu no
 * `<body>`, leva ao primeiro alvo da lista que existir.
 */
export function refocusAfterRetry(retry: () => Promise<unknown>, selectors: string) {
  void retry().finally(() => {
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && active !== document.body && active.isConnected) return;
      document.querySelector<HTMLElement>(selectors)?.focus();
    });
  });
}

/**
 * Etapa 12: para onde vai o foco quando um diálogo da galeria fecha. Espera o
 * diálogo sair da tela e, se a foto foi excluída, espera também o "⋯" dela
 * sumir (a lista recarrega depois da exclusão). Aí foca o primeiro alvo que
 * existir — o "⋯" da foto vizinha, a ação de envio do cabeçalho ou a do
 * estado vazio — e nunca deixa o foco no `<body>`.
 */
export function focusAfterDialog({
  trigger,
  removed,
  candidateIds,
}: {
  /** O "⋯" que abriu o diálogo. */
  trigger: HTMLElement | null;
  /** A foto saiu: o gatilho está prestes a sumir. */
  removed: boolean;
  /** Em ordem: vizinho seguinte, vizinho anterior, envio do cabeçalho, envio do estado vazio. */
  candidateIds: string[];
}) {
  const startedAt = performance.now();
  const check = () => {
    const waiting = document.querySelector('[role="dialog"], [role="alertdialog"]') || (removed && trigger?.isConnected);
    if (waiting) {
      if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
      return;
    }
    if (!removed && trigger?.isConnected) {
      trigger.focus();
      return;
    }
    for (const id of candidateIds) {
      const target = document.getElementById(id);
      if (target) {
        target.focus();
        return;
      }
    }
    // A lista ainda não chegou (o estado vazio troca a grade): tenta de novo por um tempo curto.
    if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}
