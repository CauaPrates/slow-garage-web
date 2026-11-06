import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Harmonização 01: `control` e `control-touch` são tamanhos do tema
 * (`--spacing-control*`, tokens.css). Sem isto o merge não reconhece
 * `h-control` como altura, e um `h-9` passado por quem usa o componente
 * ficaria junto em vez de substituir.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ["control", "control-touch"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
