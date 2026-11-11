import type { ComponentType, ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PANEL_CLASSNAME } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

/**
 * Harmonização 01 — estados de tela compartilhados. O texto continua sendo de
 * cada tela (o que falhou, o que continua como estava); a forma, o ícone, o
 * papel ARIA e o "Tentar de novo" ficam aqui.
 */

type InlineErrorProps = {
  children: ReactNode;
  onRetry?: () => void;
  className?: string;
};

/**
 * Falha de um bloco dentro do painel (lista, resumo): o resto da página
 * segue de pé, filtros e busca continuam como estão. `role="alert"` anuncia
 * uma vez; "Tentar de novo" em contorno, nunca laranja.
 */
export function InlineError({ children, onRetry, className }: InlineErrorProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-start gap-2 p-(--panel-pad-x)", className)}>
      <p className="flex items-start gap-2 text-sm text-text-secondary">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" aria-hidden="true" />
        <span className="min-w-0">{children}</span>
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

type PageErrorProps = {
  message: string;
  onRetry?: () => void;
};

/** A página inteira não carregou (veículo, categorias): centralizada, com nova tentativa. */
export function PageError({ message, onRetry }: PageErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 p-12 text-center">
      <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

type NoResultsProps = {
  /** "Nenhum gasto encontrado com estes filtros." */
  message: string;
  /** A seleção atual e o que ficou fora dela. */
  detail?: ReactNode;
  onClear: () => void;
  /** Etapa 13: a busca do Histórico desfaz o termo, não os filtros ("Limpar busca"). */
  clearLabel?: string;
};

/** Filtro sem resultado: dentro da lista, com a seleção escrita e "Limpar filtros" — os filtros continuam à vista. */
export function NoResults({ message, detail, onClear, clearLabel = "Limpar filtros" }: NoResultsProps) {
  return (
    <div className="flex flex-col items-start gap-2 px-(--panel-pad-x) py-6">
      <p className="text-sm break-words text-text-primary">{message}</p>
      {detail && <p className="text-sm break-words text-text-secondary">{detail}</p>}
      <Button variant="outline" onClick={onClear}>
        {clearLabel}
      </Button>
    </div>
  );
}

type EmptyStateProps = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  title: ReactNode;
  /** `id` do título — a página leva o foco pra ele quando o último registro sai. */
  titleId?: string;
  children?: ReactNode;
  /** A ação que tira a tela do vazio ("Registrar primeiro gasto"). Vazio sem ação é beco sem saída. */
  action?: ReactNode;
  /**
   * `panel` (padrão): a tela inteira está vazia — painel próprio, título `h2`.
   * `inline`: um bloco vazio dentro de um painel que já tem título (o plano
   * ou o histórico de Manutenção) — sem caixa nem cabeçalho novo.
   */
  variant?: "panel" | "inline";
  className?: string;
};

/**
 * Vazio de verdade (nenhum registro, sem filtro): ícone discreto, o que
 * falta, o que entra aqui e a ação. "Sem resultado para o filtro" não é este
 * estado — fica dentro da lista, com os filtros (`NoResults`).
 */
export function EmptyState({ icon: Icon, title, titleId, children, action, variant = "panel", className }: EmptyStateProps) {
  const body = (
    <>
      <Icon className="h-6 w-6 text-text-muted" aria-hidden="true" />
      {variant === "panel" ? (
        <h2 id={titleId} className="font-medium text-text-primary">
          {title}
        </h2>
      ) : (
        <p className="font-medium text-text-primary">{title}</p>
      )}
      {children && <div className="max-w-md text-sm text-text-secondary">{children}</div>}
      {action && <div className="mt-1">{action}</div>}
    </>
  );
  if (variant === "inline") {
    return <div className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>{body}</div>;
  }
  return (
    <section
      aria-labelledby={titleId}
      className={cn(PANEL_CLASSNAME, "flex flex-col items-center gap-3 px-6 py-12 text-center", className)}
    >
      {body}
    </section>
  );
}

const ALERT_TONES = {
  error: { icon: AlertCircle, rule: "border-l-error", text: "text-error" },
  warning: { icon: AlertTriangle, rule: "border-l-warning", text: "text-warning" },
  info: { icon: Info, rule: "border-l-info", text: "text-info" },
  success: { icon: CheckCircle2, rule: "border-l-success", text: "text-success" },
} as const;

type AlertProps = {
  tone: keyof typeof ALERT_TONES;
  children: ReactNode;
  /** Ação curta à direita (link "Ver pendências", fechar). */
  action?: ReactNode;
  role?: "status" | "alert";
  className?: string;
};

/**
 * Aviso de página: superfície neutra com fio de 2px à esquerda na cor do
 * papel e o ícone na mesma cor — o texto continua no tom de leitura. O mesmo
 * idioma do bloco de vencidas de Manutenção e do aviso do dashboard.
 */
export function Alert({ tone, children, action, role, className }: AlertProps) {
  const { icon: Icon, rule, text } = ALERT_TONES[tone];
  return (
    <div
      role={role}
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-l-2 border-border bg-surface py-2 pr-2 pl-4 sm:flex-row sm:items-center sm:gap-3",
        rule,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2 py-1 text-sm">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", text)} aria-hidden="true" />
        <div className="min-w-0">{children}</div>
      </div>
      {action}
    </div>
  );
}
