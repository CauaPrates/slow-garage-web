import { useEffect, useRef, type RefObject } from "react";

/**
 * Etapa 15 — "Tentar de novo" some quando a consulta volta, e o foco caía no
 * `<body>` (medido no sino, na caixa de entrada e em Meus convites). Depois
 * de uma nova tentativa que deu certo, o foco vai para o bloco que carregou.
 *
 * `loadedAt` é o `dataUpdatedAt` da consulta: muda a cada busca com sucesso,
 * mesmo quando os dados chegam iguais. Devolve o `onRetry` para o
 * `InlineError`.
 */
export function useRetryFocus(loadedAt: number, target: RefObject<HTMLElement | null>) {
  const waiting = useRef(false);

  useEffect(() => {
    if (!waiting.current || !loadedAt) return;
    waiting.current = false;
    target.current?.focus();
  }, [loadedAt, target]);

  return (refetch: () => unknown) => {
    waiting.current = true;
    void refetch();
  };
}
