import { useRef } from "react";

/**
 * Etapa 05: diálogo aberto por estado (sem `DialogTrigger`) não tem pra onde
 * devolver o foco — o Radix tenta o gatilho, que não existe, e o foco cai no
 * `<body>`. `capture()` guarda o que estava focado quando o diálogo abriu
 * (chame no `onOpenAutoFocus`); `onCloseAutoFocus` devolve o foco a ele se ele
 * ainda estiver na tela. Se sumiu (ex.: item de um menu que já fechou), não faz
 * nada e quem abriu o diálogo decide.
 *
 * Etapa 16: `visible` devolve o foco com o anel à vista mesmo depois de um
 * clique em "Cancelar" (`focus({ focusVisible: true })`) — sem ele, o navegador
 * só mostra o anel se a última interação foi pelo teclado. Opcional: os
 * diálogos que já usavam o hook continuam como estavam.
 */
export function useReturnFocus({ visible = false }: { visible?: boolean } = {}) {
  const returnTo = useRef<HTMLElement | null>(null);
  return {
    capture() {
      const active = document.activeElement;
      returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
    },
    onCloseAutoFocus(event: Event) {
      const element = returnTo.current;
      returnTo.current = null;
      if (element?.isConnected) {
        event.preventDefault();
        element.focus(visible ? { focusVisible: true } : undefined);
      }
    },
  };
}
