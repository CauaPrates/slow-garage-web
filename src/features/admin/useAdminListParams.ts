import { useSearchParams } from "react-router-dom";

/**
 * Filtros e página das listas do painel moram na URL (`?pagina=2&...`):
 * voltar do detalhe de um usuário devolve a lista no mesmo ponto, e o
 * link é compartilhável entre admins. Página na URL começa em 1; no
 * código, em 0 (offset).
 */
export function useAdminListParams() {
  const [params, setParams] = useSearchParams();

  const page = Math.max(Number.parseInt(params.get("pagina") ?? "1", 10) || 1, 1) - 1;

  /** Atualiza filtros; qualquer mudança de filtro volta pra primeira página. */
  function setFilters(changes: Record<string, string | null>) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        next.delete("pagina");
        return next;
      },
      { replace: true },
    );
  }

  function setPage(nextPage: number) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage > 0) next.set("pagina", String(nextPage + 1));
      else next.delete("pagina");
      return next;
    });
  }

  return { params, page, setFilters, setPage };
}
