/**
 * Etapa 11: a mesma volta de foco de Modificações e Problemas. Espera o
 * diálogo sair; se o gatilho continua na tela, volta pra ele; se sumiu (a
 * linha foi excluída, o estado vazio deu lugar à lista), leva ao título da
 * seção — nunca deixa o foco no `<body>`.
 *
 * `removed`: o registro foi excluído — espera a linha (e o "⋯") sair da tela
 * antes de decidir, senão o foco iria pro gatilho que está prestes a sumir.
 */
export function restoreFocus(trigger: HTMLElement | null, fallbackId: string, removed = false) {
  const startedAt = performance.now();
  const check = () => {
    const waiting =
      document.querySelector('[role="dialog"], [role="alertdialog"]') || (removed && trigger?.isConnected);
    if (waiting) {
      if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
      return;
    }
    if (trigger?.isConnected) {
      trigger.focus();
      return;
    }
    if (document.activeElement && document.activeElement !== document.body) return;
    const target = document.getElementById(fallbackId) ?? document.querySelector<HTMLElement>("main h1");
    if (!target) return;
    if (!target.matches("button, a, input, select, textarea")) target.tabIndex = -1;
    target.focus();
  };
  requestAnimationFrame(check);
}
