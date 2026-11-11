import { useCallback, useSyncExternalStore } from "react";

/**
 * Valor atual de uma media query, atualizado quando ela muda (redimensionar,
 * trocar a preferência de movimento). Lido já no primeiro render — quem usa
 * pode decidir não montar algo (e não baixar as imagens dele) antes de pintar.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
