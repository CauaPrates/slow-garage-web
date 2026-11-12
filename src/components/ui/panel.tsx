import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { textLinkClassName } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";

/**
 * Harmonização 01 — superfície de painel e as peças que todo painel repete.
 * Era o `DashboardPanel` (etapa 04) e a constante `PANEL_CLASSNAME` copiada em
 * seis páginas de registro; agora é um lugar só: mudar a borda, o raio, o
 * respiro ou o título de seção aqui muda o dashboard, a garagem ("Detalhes"),
 * Gastos, Abastecimentos, Manutenção, Problemas, Projetos e Modificações.
 */

/** Superfície do painel: borda neutra, raio grande, conteúdo colado nas bordas (divisores de 1px, nunca card dentro de card). */
export const PANEL_CLASSNAME = "min-w-0 overflow-hidden rounded-lg border border-border bg-surface";

type PanelHeaderProps = {
  title: ReactNode;
  /** `id` do título — o painel aponta pra ele (`aria-labelledby`) e a página pode focá-lo. */
  titleId: string;
  /** Uma linha discreta sob o título — de onde vem o dado e qual período cobre. */
  description?: ReactNode;
  /** À direita: link curto ("Ver histórico"), contagem da lista ou ações do grupo. */
  action?: ReactNode;
  headingLevel?: "h2" | "h3";
  className?: string;
};

/** Cabeçalho de painel: título de seção + contexto à esquerda, ação ou contagem à direita, fio embaixo. */
export function PanelHeader({
  title,
  titleId,
  description,
  action,
  headingLevel: Heading = "h2",
  className,
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-border px-(--panel-pad-x) py-(--panel-pad-y)",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <Heading id={titleId} className="type-section-title text-text-primary">
          {title}
        </Heading>
        {description && <p className="type-caption text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

type PanelProps = Omit<PanelHeaderProps, "titleId"> & {
  /** `id` fixo do título, quando outro bloco precisa apontar pra ele (âncora do aviso de pendências). */
  titleId?: string;
  children: ReactNode;
};

/** Painel com cabeçalho — a casca dos blocos do dashboard e das listas de registro. */
export function Panel({ title, description, action, headingLevel, titleId: fixedTitleId, className, children }: PanelProps) {
  const generatedId = useId();
  const titleId = fixedTitleId ?? generatedId;
  return (
    <section aria-labelledby={titleId} className={cn(PANEL_CLASSNAME, "flex flex-col", className)}>
      <PanelHeader
        title={title}
        titleId={titleId}
        description={description}
        action={action}
        headingLevel={headingLevel}
      />
      {children}
    </section>
  );
}

/** Contagem da lista no cabeçalho do painel ("7 registros · R$ 1.250,00 nesta seleção"). Anunciada ao mudar. */
export function PanelCount({ children }: { children?: ReactNode }) {
  return (
    <p aria-live="polite" className="type-caption pt-0.5 text-text-secondary">
      {children}
    </p>
  );
}

/**
 * Cabeçalho das colunas de uma lista a partir de `md` (`aria-hidden`: cada
 * linha já diz o que é cada valor). Quem usa passa o mesmo molde de grade da
 * linha, pra coluna e cabeçalho alinharem.
 */
export function ListColumns({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "type-caption hidden border-b border-border px-(--panel-pad-x) py-2 text-text-secondary md:grid",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Link de cabeçalho de painel: texto neutro, só a seta no acento. Margem negativa: o alvo de 44px não aumenta o cabeçalho. */
export const PANEL_LINK_CLASSNAME = cn(textLinkClassName("xs"), "-my-3 -mr-2 shrink-0 px-2");

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
        className="flex min-h-control w-full items-center justify-between gap-2 border-t border-border px-(--panel-pad-x) py-2 text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
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
