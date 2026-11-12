import { useRef } from "react";

/**
 * Etapa 05: diálogo aberto por estado (sem `DialogTrigger`) não tem pra onde
 * devolver o foco — o Radix tenta o gatilho, que não existe, e o foco cai no
 * `<body>`. `capture()` guarda o que estava focado quando o diálogo abriu
 * (chame no `onOpenAutoFocus`); `onCloseAutoFocus` devolve o foco a ele se ele
 * ainda estiver na tela. Se sumiu (ex.: item de um menu que já fechou), não faz
 * nada e quem abriu o diálogo decide.
 */
export function useReturnFocus() {
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
        element.focus();
      }
    },
  };
}
