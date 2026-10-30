import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Fase 14: `active:scale-95` é o botão "cedendo" ao toque, como um controle físico de painel — parte do sistema de resposta (docs/DESIGN.md).
 * Etapa 01: o foco usa o contorno global de `:focus-visible` (antes um `outline-none` sem substituto deixava o botão sem foco visível no teclado).
 * `destructive` é carmim cheio — distinto do laranja de `primary` em matiz, não só em tom.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,transform] duration-(--duration-fast) motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:bg-accent-hover",
        ghost: "text-text-primary hover:bg-state-hover active:bg-state-active",
        outline:
          "border border-border-strong/60 bg-transparent text-text-primary hover:border-border-strong hover:bg-state-hover active:bg-state-active",
        destructive: "bg-error text-error-foreground hover:bg-error/90",
      },
      size: {
        default: "h-11 px-4 py-2",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
