import { Link } from "react-router-dom";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Stat = { label: string; value: number; href?: string };

type StatListProps = {
  stats: Stat[];
  /** Colunas a partir de `sm` — no mobile é sempre uma lista. */
  columnsClassName?: string;
};

/**
 * Contagens do painel. No mobile é uma ficha técnica (uma linha por
 * número, rótulo à esquerda e valor à direita, num card só) — 16 cards
 * empilhados em 2 colunas viravam uma parede. Do `sm` pra cima vira grade
 * de cards. O valor vem primeiro no DOM e a ordem visual muda por
 * `flex-row-reverse`/`flex-col`, sem duplicar marcação.
 */
export function StatList({ stats, columnsClassName = "sm:grid-cols-3 xl:grid-cols-5" }: StatListProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 divide-y divide-border rounded-lg border border-border bg-surface",
        "sm:gap-3 sm:divide-y-0 sm:rounded-none sm:border-0 sm:bg-transparent",
        columnsClassName,
      )}
    >
      {stats.map((stat) => {
        const itemClassName = cn(
          "flex min-h-11 flex-row-reverse items-center justify-between gap-3 px-4 py-2.5",
          "sm:h-full sm:flex-col sm:items-start sm:justify-start sm:gap-0.5 sm:rounded-lg sm:border sm:border-border sm:bg-surface sm:p-4",
        );
        const content = (
          <>
            <span className="font-mono text-base font-medium text-text-primary sm:text-lg">
              {formatCount(stat.value)}
            </span>
            <span className="text-sm text-text-secondary sm:text-xs">{stat.label}</span>
          </>
        );
        return (
          <li key={stat.label}>
            {stat.href ? (
              <Link
                to={stat.href}
                className={cn(itemClassName, "transition-colors duration-150 hover:bg-bg sm:hover:border-accent sm:hover:bg-surface")}
              >
                {content}
              </Link>
            ) : (
              <div className={itemClassName}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
