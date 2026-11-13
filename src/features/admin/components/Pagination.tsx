import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";

type PaginationProps = {
  page: number;
  pageSize: number;
  /** `total_count` do backend — vem repetido em cada linha da página. */
  totalCount: number;
  onPageChange: (page: number) => void;
  /** Trava os botões enquanto a próxima página carrega. */
  isFetching?: boolean;
  /** Plural do que a lista conta ("usuários", "eventos"). */
  itemLabel: string;
};

/**
 * Rodapé de paginação de um painel. Etapa 16: os botões ficam
 * `aria-disabled` (não `disabled`) — com `disabled` o botão que acabou de ser
 * usado na última página ou durante a carga perdia o foco para o `<body>`.
 */
export function Pagination({ page, pageSize, totalCount, onPageChange, isFetching, itemLabel }: PaginationProps) {
  // Página vazia (ex.: `?pagina=9` numa lista que encolheu) não tem `total_count` — quem chama oferece voltar pra primeira.
  if (totalCount === 0 || (totalCount <= pageSize && page === 0)) return null;

  const first = page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, totalCount);
  const canPrevious = page > 0 && !isFetching;
  const canNext = last < totalCount && !isFetching;

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-3 border-t border-border px-(--panel-pad-x) py-2"
    >
      <p className="text-sm text-text-secondary" aria-live="polite">
        <span className="type-value text-sm text-text-primary">
          {formatCount(first)}–{formatCount(last)}
        </span>{" "}
        de {formatCount(totalCount)} {itemLabel}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          aria-disabled={!canPrevious || undefined}
          onClick={() => canPrevious && onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Próxima página"
          aria-disabled={!canNext || undefined}
          onClick={() => canNext && onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
