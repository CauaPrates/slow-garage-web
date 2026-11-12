import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Harmonização 01 — acordeão de linha ("Detalhes" de Problemas, do plano de
 * Manutenção e dos itens de Projeto). O conteúdo continua montado com
 * `hidden`: fechar só esconde, nada é recalculado. Outras formas do mesmo
 * padrão: `PanelDisclosure` (rodapé de painel) e `FormSection` recolhível.
 */
type DisclosureButtonProps = {
  open: boolean;
  /** `id` da região que o botão abre. */
  controls: string;
  /** `id` do texto que diz de qual registro são os detalhes. */
  describedBy?: string;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
};

export function DisclosureButton({ open, controls, describedBy, onToggle, children, className }: DisclosureButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-describedby={describedBy}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-control shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary",
        className,
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 motion-safe:transition-transform motion-safe:duration-(--duration-base)",
          open && "rotate-180",
        )}
        aria-hidden="true"
      />
    </button>
  );
}

/** Superfície recuada dos detalhes abertos e do cartão de registro na exclusão. */
export const INSET_CLASSNAME = "rounded-md border border-border bg-bg px-3 py-2.5";

/** Par rótulo/valor dos detalhes. Ausente é escrito ("Não informado"), nunca vira zero nem some. */
export function DetailItem({ label, value, wide = false }: { label: string; value: string | null; wide?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", wide && "sm:col-span-2")}>
      <dt className="type-caption text-text-secondary">{label}</dt>
      <dd className={cn("break-words whitespace-pre-line", value ? "text-text-primary" : "text-text-secondary")}>
        {value ?? "Não informado"}
      </dd>
    </div>
  );
}
