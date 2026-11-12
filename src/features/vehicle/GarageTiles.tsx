import type { ReactNode } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import { Skeleton } from "@/components/ui/skeleton";
import { useFlashOnChange } from "@/hooks/useFlashOnChange";
import { cn } from "@/lib/utils";

export type GarageTileState =
  | { status: "loading" }
  | { status: "error"; onRetry: () => void }
  | { status: "ready" };

type GarageTileProps = {
  label: string;
  value?: ReactNode;
  /** Segunda linha discreta do módulo — contexto do número (de qual veículo, quantos vencidos), nunca outro número solto. */
  hint?: string;
  state?: GarageTileState;
  /** Nome longo (manutenção, veículo) quebra linha em vez de cortar: o painel é de leitura, não de varredura. */
  wrap?: boolean;
  /**
   * Número (padrão) usa o papel `type-value` — display com algarismos
   * tabulares; nome (ex.: item de manutenção) fica na fonte de interface.
   * Harmonização 01: era `mono`; mono ficou só para placa e código.
   */
  numeric?: boolean;
  /** Complemento da dica que só cabe a partir de `sm` (no celular o módulo é estreito). */
  hintDetail?: string;
  /** Com `wrap`, a dica fica em até 2 linhas; `fullHint` mostra inteira (painel de detalhes). */
  fullHint?: boolean;
  /** Etapa 04: `lg` é o indicador principal do dashboard do veículo — mesmo módulo, número maior. */
  size?: "default" | "lg";
  /** Realce de 400ms quando o valor muda (sistema de resposta, `useFlashOnChange`). Só com `motion-safe`. */
  flashOnChange?: boolean;
  /**
   * Etapa 05: explicação completa do número, aberta por clique/toque/teclado
   * num botão "i" ao lado do rótulo (nunca só no hover). Com ela, a `hint`
   * pode ficar curta.
   */
  help?: ReactNode;
  className?: string;
};

/** Botão de ajuda do módulo (o `InfoTip` comum): margem negativa, pra o alvo de 44px não aumentar a linha do rótulo. */
function TileHelp({ label, help }: { label: string; help: ReactNode }) {
  return (
    <InfoTip label={`Como é calculado: ${label}`} heading={label} className="-my-3 -mr-2">
      <div>{help}</div>
    </InfoTip>
  );
}

/**
 * Só monta com o módulo pronto: a chegada do primeiro dado (carregando →
 * pronto) não pisca; uma mudança depois dela (novo registro, refetch), sim.
 */
function TileValue({ value, flash, className }: { value: ReactNode; flash: boolean; className: string }) {
  const flashing = useFlashOnChange(flash ? value : null);
  return (
    <span
      className={cn(className, flash && "w-fit max-w-full rounded-sm", flashing && "motion-safe:animate-value-flash")}
      title={typeof value === "string" ? value : undefined}
    >
      {value}
    </span>
  );
}

/**
 * Módulo da grade de instrumentos (ADR-070): rótulo, valor no papel `type-value`,
 * dica opcional. Erro de consulta nunca vira zero nem "nada pendente": o
 * módulo mostra "—", diz que não carregou e oferece tentar de novo.
 */
export function GarageTile({
  label,
  value,
  hint,
  state = { status: "ready" },
  wrap = false,
  numeric = true,
  hintDetail,
  fullHint = false,
  size = "default",
  flashOnChange = false,
  help,
  className,
}: GarageTileProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 border-t border-l border-border px-3 py-2.5 sm:px-4 sm:py-3",
        className,
      )}
    >
      {help ? (
        <dt className="type-overline flex items-center justify-between gap-2 text-text-secondary">
          <span className="min-w-0">{label}</span>
          <TileHelp label={label} help={help} />
        </dt>
      ) : (
        <dt className="type-overline text-text-secondary">{label}</dt>
      )}
      <dd className="min-w-0">
        {state.status === "loading" && (
          <>
            <span className="sr-only">Carregando…</span>
            <Skeleton className="h-5 w-20 rounded-sm" />
          </>
        )}
        {state.status === "error" && (
          <span className="flex flex-col items-start">
            <span className="type-value text-text-primary" aria-hidden="true">
              —
            </span>
            <span className="text-xs text-error">Não foi possível carregar.</span>
            <button
              type="button"
              onClick={state.onRetry}
              className="-ml-1 flex min-h-11 items-center px-1 text-xs font-medium text-text-primary underline decoration-border-strong underline-offset-4 hover:decoration-text-primary"
            >
              Tentar de novo
            </button>
          </span>
        )}
        {state.status === "ready" && (
          <>
            <TileValue
              value={value}
              flash={flashOnChange}
              className={cn(
                "block text-text-primary",
                numeric ? "type-value" : "font-medium",
                size === "lg" && "text-xl leading-tight sm:text-2xl",
                wrap ? "break-words" : "truncate",
              )}
            />
            {hint && (
              <span
                className={cn(
                  "block text-xs text-text-secondary",
                  // Dica longa (nome de veículo) fica em 2 linhas; o texto inteiro segue no `title` e no leitor de tela.
                  wrap
                    ? cn("break-words", !fullHint && "line-clamp-2")
                    : "truncate",
                )}
                title={hintDetail ? `${hint} · ${hintDetail}` : hint}
              >
                {hint}
                {hintDetail && (
                  <span className="hidden sm:inline"> · {hintDetail}</span>
                )}
              </span>
            )}
          </>
        )}
      </dd>
    </div>
  );
}

/**
 * Grade com fio de 1px entre módulos em vez de card dentro de card.
 * `-mt-px -ml-px` + `border-t border-l` em cada módulo desenha cada linha
 * interna uma vez só e joga as externas pra debaixo da borda do painel (que
 * precisa de `overflow-hidden`) — funciona em qualquer contagem de coluna.
 */
export function GarageTileGrid({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <dl className={cn("-mt-px -ml-px grid", className)}>{children}</dl>;
}
