import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Stat = {
  label: string;
  value: number;
  /** Atalho: a célula inteira vira link para a tela que detalha o número. */
  href?: string;
  /** Complemento do nome do link ("abrir a lista de usuários"). */
  linkLabel?: string;
};

type StatListProps = {
  stats: Stat[];
  /** Carregando: o rótulo fica à vista e o valor é um bloco pulsante — nunca um zero. */
  loading?: boolean;
  /** Colunas a partir de `sm` — no celular é sempre uma linha por número. */
  columnsClassName?: string;
};

/**
 * Contagens do painel, dentro de um `Panel`. Etapa 16: valor no papel de
 * indicador (`type-stat`, display tabular — era mono) e células com filete de
 * 1px em vez de cartão dentro de cartão. No celular, uma linha por número
 * (rótulo à esquerda, valor à direita); do `sm` pra cima, grade com o rótulo
 * em cima. Os filetes de cima e da esquerda de cada célula ficam por baixo da
 * borda do painel (margem negativa + `overflow-hidden` do painel), então a
 * grade não precisa saber quantas colunas tem para desenhá-los.
 */
export function StatList({ stats, loading = false, columnsClassName = "sm:grid-cols-2 lg:grid-cols-3" }: StatListProps) {
  return (
    <div aria-busy={loading || undefined}>
      {loading && <span className="sr-only">Carregando contagens…</span>}
      <ul className={cn("-mt-px -ml-px grid grid-cols-1", columnsClassName)}>
        {stats.map((stat) => {
          const cell =
            "flex min-h-control items-center justify-between gap-3 border-t border-l border-border px-(--panel-pad-x) py-2.5 sm:h-full sm:flex-col sm:items-start sm:justify-start sm:gap-1 sm:py-3";
          const label = (
            <span className="flex items-center gap-1 text-sm text-text-secondary">
              {stat.label}
              {stat.href && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />}
            </span>
          );
          const value = loading ? (
            <Skeleton className="h-6 w-12" />
          ) : (
            <span className="type-stat text-text-primary">{formatCount(stat.value)}</span>
          );
          return (
            <li key={stat.label}>
              {stat.href ? (
                <Link
                  to={stat.href}
                  className={cn(cell, "transition-colors duration-(--duration-fast) hover:bg-state-hover")}
                >
                  {label}
                  {value}
                  {stat.linkLabel && <span className="sr-only"> — {stat.linkLabel}</span>}
                </Link>
              ) : (
                <div className={cell}>
                  {label}
                  {value}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
