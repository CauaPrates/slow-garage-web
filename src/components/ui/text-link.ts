import { cn } from "@/lib/utils";

/**
 * Harmonização 01: link em texto (e botão que se comporta como link) —
 * texto neutro sublinhado com o fio em `border-strong`, que acende no hover.
 * O laranja fica só na seta/ícone, quando houver (mesmo idioma do
 * "Abrir veículo →"). Alvo de 44px na altura, sem aumentar a linha: quem
 * usa dentro de texto soma a margem negativa.
 */
export function textLinkClassName(size: "sm" | "xs" = "sm") {
  return cn(
    "inline-flex min-h-control items-center gap-1 rounded-md px-1 font-medium text-text-primary underline decoration-border-strong underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-text-primary",
    size === "xs" ? "text-xs" : "text-sm",
  );
}
