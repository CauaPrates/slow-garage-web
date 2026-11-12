import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Harmonização 01 — composição das páginas de registro (Gastos,
 * Abastecimentos, Manutenção, Problemas, Projetos, Modificações) e do
 * dashboard do veículo. A margem, o respiro e o vão entre blocos vêm dos
 * tokens `--page-*`; nenhuma página repete os números. Largura toda: em
 * monitor largo quem se ajusta são as colunas das listas, não a página.
 *
 * A Garagem não usa: a capa, o resumo e a coleção têm margens próprias
 * (`--garage-gutter`, garage.css).
 */
export function Page({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-(--page-gap) px-(--page-gutter) py-(--page-pad-y)", className)}
      {...props}
    />
  );
}

type PageHeaderProps = {
  /** Nome fixo da tela ("Gastos"). Nome de registro (projeto, veículo) usa `type-entity-title` no próprio cabeçalho. */
  title: ReactNode;
  /** Uma frase de contexto — o escopo da tela, nunca um parágrafo. Pode trazer o "i" de ajuda. */
  description?: ReactNode;
  /** Ação principal (uma; duas só com `stackActionsOnMobile`). Some quando a tela está vazia: o estado vazio leva a ação. */
  actions?: ReactNode;
  /**
   * Com duas ações (Manutenção), abaixo de `sm` elas descem para baixo do
   * título em largura cheia, em vez de espremer o título.
   */
  stackActionsOnMobile?: boolean;
};

/**
 * Cabeçalho compacto de página de registros: título de página em display
 * caixa-alta, uma linha de contexto e a ação principal à direita (no celular,
 * ao lado do título com rótulo curto). Sem título gigante: o primeiro
 * registro aparece logo abaixo.
 */
export function PageHeader({ title, description, actions, stackActionsOnMobile = false }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex gap-3 sm:items-end sm:justify-between sm:gap-4",
        // Uma ação: filha direta do cabeçalho, sem encolher (a mesma estrutura de antes da harmonização).
        // `flex-wrap`: se a palavra mais longa do título e a ação não cabem lado a lado ("ABASTECIMENTOS" em 320–360px),
        // a ação desce para a linha de baixo — o título nunca passa por baixo do botão nem é cortado.
        stackActionsOnMobile ? "flex-col sm:flex-row" : "flex-wrap items-start justify-between [&>button]:shrink-0",
      )}
    >
      {/* Base 0 + mínimo = conteúdo mínimo: cresce até a ação, mas nunca fica menor que a palavra mais longa. */}
      <div className={cn("flex flex-col gap-1.5", stackActionsOnMobile ? "min-w-0" : "min-w-min flex-1 basis-0")}>
        <h1 className="type-page-title text-text-primary">{title}</h1>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {actions &&
        (stackActionsOnMobile ? (
          <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0 sm:gap-3">{actions}</div>
        ) : (
          actions
        ))}
    </header>
  );
}

/**
 * Rótulo de ação principal que encolhe no celular: "Registrar" à vista e o
 * resto ("gasto") só a partir de `sm` — o nome acessível é sempre o
 * completo. Um nó de texto só, pra o `gap` do botão não somar espaço.
 */
export function ActionLabel({ short, rest }: { short: string; rest: string }) {
  return (
    <span>
      {short}
      <span className="sr-only sm:not-sr-only"> {rest}</span>
    </span>
  );
}
