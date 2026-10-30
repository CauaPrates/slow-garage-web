import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Casca visual comum a todo campo de formulário (Input, Textarea, Select,
 * gatilho do Combobox, ComboboxInput) — um lugar só pra borda, foco, erro e
 * desabilitado, em vez de cinco cópias que divergem. Borda em
 * `border-strong` (3:1 contra o fundo, WCAG 1.4.11); foco troca a borda pro
 * acento e soma um anel; erro (`aria-invalid`) vence o hover.
 */
export const fieldClassName =
  "w-full min-w-0 rounded-md border border-border-strong bg-field px-3 py-2 text-base text-text-primary outline-none transition-[border-color,box-shadow] duration-(--duration-fast) placeholder:text-text-secondary hover:border-text-secondary focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:bg-state-hover disabled:opacity-60 disabled:hover:border-border-strong aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20 md:text-sm";

export function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldClassName, "h-11", className)}
      {...props}
    />
  );
}
