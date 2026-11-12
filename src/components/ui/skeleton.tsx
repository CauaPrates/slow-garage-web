import { cn } from "@/lib/utils";

/**
 * Harmonização 01: bloco de carregamento. Sem brilho nem deslize — só o
 * pulso padrão, que some com movimento reduzido no sistema (o Tailwind
 * respeita `prefers-reduced-motion` em `motion-safe`). Sempre decorativo:
 * quem usa diz o que está carregando num texto `sr-only` ou `aria-busy`.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("block rounded-md bg-state-hover motion-safe:animate-pulse", className)} />
  );
}

type SkeletonListProps = {
  /** Lido pelo leitor de tela: "Carregando lançamentos…". */
  label: string;
  rows?: number;
  className?: string;
};

/** Lista carregando dentro de um painel: N linhas da altura de uma linha de registro. */
export function SkeletonList({ label, rows = 3, className }: SkeletonListProps) {
  return (
    <div className={cn("flex flex-col gap-2 p-(--panel-pad-x)", className)} aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
