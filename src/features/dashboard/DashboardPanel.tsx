import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardPanelProps = {
  title: ReactNode;
  /** Uma linha discreta sob o título — de onde vem o dado e qual período cobre. */
  description?: ReactNode;
  /** Link ou ação curta à direita do título ("Ver histórico"). */
  action?: ReactNode;
  /** Etapa 05: gráfico dentro de uma seção que já tem `h2` (dashboard, "Detalhes da garagem") usa `h3`. */
  headingLevel?: "h2" | "h3";
  /** `id` fixo do título, quando outro bloco precisa apontar pra ele (âncora do aviso de pendências). */
  titleId?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Etapa 04: casca comum dos blocos do dashboard do veículo — mesmo cabeçalho
 * do "Resumo financeiro" da garagem (título `text-sm`, linha de contexto, fio
 * embaixo) e conteúdo colado nas bordas, pra lista e grade de instrumentos
 * usarem divisor de 1px em vez de card dentro de card.
 */
export function DashboardPanel({
  title,
  description,
  action,
  headingLevel: Heading = "h2",
  titleId: fixedTitleId,
  className,
  children,
}: DashboardPanelProps) {
  const generatedId = useId();
  const titleId = fixedTitleId ?? generatedId;
  return (
    <section
      aria-labelledby={titleId}
      className={cn("flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface", className)}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Heading id={titleId} className="text-sm font-medium text-text-primary">
            {title}
          </Heading>
          {description && <p className="text-xs text-text-secondary">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Link de cabeçalho de painel: texto neutro, só a seta no acento (mesmo idioma do "Abrir veículo →" da etapa 02). */
export const PANEL_LINK_CLASSNAME =
  "-my-3 -mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-text-primary underline decoration-border-strong underline-offset-4 hover:decoration-text-primary";

type PanelDisclosureProps = {
  label: string;
  /** Complemento em cinza do rótulo — o que a expansão guarda. */
  hint?: string;
  children: ReactNode;
};

/**
 * Expansão no rodapé do painel (mesma forma do "Detalhes da garagem"):
 * `aria-expanded` + `aria-controls`, começa fechada, e fechar só esconde —
 * nada é desmontado nem recalculado.
 */
export function PanelDisclosure({ label, hint, children }: PanelDisclosureProps) {
  const regionId = useId();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={regionId}
        className="flex min-h-11 w-full items-center justify-between gap-2 border-t border-border px-4 py-2 text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
      >
        <span>
          {label}
          {hint && <span className="font-normal text-text-secondary"> — {hint}</span>}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-(--duration-fast)",
            open && "rotate-180",
          )}
        />
      </button>
      <div id={regionId} hidden={!open}>
        {children}
      </div>
    </>
  );
}
