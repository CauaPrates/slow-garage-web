import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Fase 14: `active:scale-95` é o botão "cedendo" ao toque, como um controle físico de painel — parte do sistema de resposta (docs/DESIGN.md). */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,transform] duration-150 motion-safe:active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:bg-accent/90",
        ghost: "text-text-primary hover:bg-surface",
        outline: "border border-border bg-transparent text-text-primary hover:bg-surface",
        destructive: "bg-error text-accent-foreground hover:bg-error/90",
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
