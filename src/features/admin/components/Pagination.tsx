import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";

type PaginationProps = {
  page: number;
  pageSize: number;
  /** `total_count` do backend — vem repetido em cada linha da página. */
  totalCount: number;
  onPageChange: (page: number) => void;
  /** Desabilita os botões enquanto a próxima página carrega. */
  isFetching?: boolean;
};

export function Pagination({ page, pageSize, totalCount, onPageChange, isFetching }: PaginationProps) {
  // Página vazia (ex.: `?pagina=9` numa lista que encolheu) não tem `total_count` — quem chama oferece voltar pra primeira.
  if (totalCount === 0 || (totalCount <= pageSize && page === 0)) return null;

  const first = page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, totalCount);
  const hasPrevious = page > 0;
  const hasNext = last < totalCount;

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
      <p className="text-sm text-text-secondary" aria-live="polite">
        {formatCount(first)}–{formatCount(last)} de {formatCount(totalCount)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          disabled={!hasPrevious || isFetching}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Próxima página"
          disabled={!hasNext || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
