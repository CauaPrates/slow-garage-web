import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type InfoTipProps = {
  /** Nome acessível do botão e do popover ("O que entra em Modificações"). */
  label: string;
  /** Título visível dentro do popover (ajuda de indicador). */
  heading?: string;
  children: ReactNode;
  /**
   * Margens negativas do lugar onde o botão mora: o alvo é de 44px, mas não
   * pode aumentar a altura da linha de texto ou do rótulo ao lado.
   */
  className?: string;
};

/**
 * Harmonização 01: o botão "i" de ajuda (Gastos, Modificações, indicadores
 * do dashboard e do resumo de Abastecimentos). Abre por clique, toque ou
 * teclado — nunca só no hover — e o conteúdo é texto de apoio, não ação.
 */
export function InfoTip({ label, heading, children, className }: InfoTipProps) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          "inline-flex size-control shrink-0 items-center justify-center rounded-md align-middle text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary",
          className,
        )}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label={heading ?? label}
        className="flex w-72 flex-col gap-2 text-sm text-text-secondary"
      >
        {heading && <p className="font-medium text-text-primary">{heading}</p>}
        {children}
      </PopoverContent>
    </Popover>
  );
}
