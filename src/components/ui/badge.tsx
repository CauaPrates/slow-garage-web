import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Harmonização 01: o selo de situação (texto + cor, nunca só cor) que
 * Manutenção, Problemas e Projetos repetiam com a mesma classe. Cada tela
 * continua decidindo **qual** tom cada status usa (`*Presentation.ts`); a
 * forma e as cores de cada tom moram aqui.
 *
 * - `neutral`: estado sem destaque (ideia, sem execução).
 * - `strong`: neutro com texto principal (trabalho em andamento sem alerta).
 * - `accent`: o "ativo" do contexto (em andamento, comprado, veículo ativo).
 * - `success` / `warning` / `error` / `info`: papéis semânticos, fundo tintado a 10%.
 * - `dashed`: encerrado sem sucesso (cancelado, descartado, inativo) — nunca parece concluído.
 */
export const badgeVariants = cva(
  "inline-flex shrink-0 items-center rounded-full border px-2 text-xs leading-5 font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border-strong text-text-secondary",
        strong: "border-border-strong text-text-primary",
        accent: "border-accent/40 bg-accent/10 text-accent",
        success: "border-success/40 bg-success/10 text-success",
        warning: "border-warning/40 bg-warning/10 text-warning",
        error: "border-error/40 bg-error/10 text-error",
        info: "border-info/40 bg-info/10 text-info",
        dashed: "border-dashed border-border-strong text-text-secondary",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  tone,
  className,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
