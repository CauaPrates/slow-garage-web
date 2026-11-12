import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SummaryState = "loading" | "error" | "ready";

/**
 * Harmonização 01 — faixa de resumo com filetes (o idioma do resumo da
 * Garagem, resolvido em Modificações): `dl` sem caixa, filete em cima, embaixo
 * e entre células; rótulo pequeno em caixa-alta sobre o valor. Encosta nas
 * bordas da área de conteúdo (margem negativa = `--page-gutter`).
 *
 * Quem usa decide quantas células e quais somem por largura (`className`).
 */
export function SummaryStrip({ label, className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <dl
      aria-label={label}
      className={cn("-mx-(--page-gutter) grid border-y border-hairline [&>*+*]:border-l [&>*+*]:border-hairline", className)}
    >
      {children}
    </dl>
  );
}

type SummaryStatProps = {
  label: string;
  value: ReactNode;
  state: SummaryState;
  /** Linha de apoio só no celular (ex.: a contagem que lá não tem célula própria). */
  mobileHint?: ReactNode;
  className?: string;
};

/**
 * Célula da faixa. Carregando é um traço pulsante (nunca um zero), falha é
 * "Indisponível" — a explicação e o "Tentar de novo" ficam na legenda da
 * faixa, uma vez só.
 */
export function SummaryStat({ label, value, state, mobileHint, className }: SummaryStatProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 px-(--page-gutter) py-2.5 sm:gap-1 sm:py-3", className)}>
      <dt className="type-overline text-text-secondary">{label}</dt>
      <dd className="min-w-0">
        {state === "loading" && (
          <>
            <span className="sr-only">Carregando…</span>
            <span className="block h-6 w-24 rounded-sm bg-state-hover motion-safe:animate-pulse" aria-hidden="true" />
          </>
        )}
        {state === "error" && <span className="text-sm text-text-secondary">Indisponível</span>}
        {state === "ready" && (
          <>
            <span className="type-stat break-words text-text-primary">{value}</span>
            {mobileHint && <span className="type-caption block text-text-secondary sm:hidden">{mobileHint}</span>}
          </>
        )}
      </dd>
    </div>
  );
}
