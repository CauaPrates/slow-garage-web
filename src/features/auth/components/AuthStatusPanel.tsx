import type { ReactNode, Ref } from "react";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  /** Pedido feito: o e-mail foi (ou seria) enviado — falta a pessoa abrir o link. */
  sent: { icon: MailCheck, rule: "border-l-info", iconClass: "text-info" },
  /** O link não vale mais (vencido, já usado ou ausente). */
  error: { icon: AlertCircle, rule: "border-l-error", iconClass: "text-error" },
  /** Conferindo o link com o servidor. */
  loading: { icon: Loader2, rule: "border-l-border-strong", iconClass: "text-text-secondary motion-safe:animate-spin" },
} as const;

type AuthStatusPanelProps = {
  tone: keyof typeof TONES;
  title: string;
  /** O título recebe o foco quando o painel substitui um formulário (o foco não cai no `<body>`). */
  titleRef?: Ref<HTMLHeadingElement>;
  children?: ReactNode;
  /** A ação que resolve o estado ("Pedir um novo link", "Ir para Entrar"). */
  action?: ReactNode;
};

/**
 * Etapa 14 — estados das telas de entrada que não são formulário: e-mail de
 * confirmação enviado, pedido de recuperação enviado, link de redefinição
 * vencido e conferência do link. O mesmo idioma do `Alert` (fio lateral na
 * cor do papel, texto no tom de leitura), com título próprio porque cada um
 * é o conteúdo principal da tela. `role="status"` anuncia a mudança sem
 * interromper; o vencido é `alert`.
 */
export function AuthStatusPanel({ tone, title, titleRef, children, action }: AuthStatusPanelProps) {
  const { icon: Icon, rule, iconClass } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex flex-col gap-4 rounded-lg border border-l-2 border-border bg-surface p-4 sm:p-5 lg:bg-bg", rule)}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-2">
          <h2 ref={titleRef} tabIndex={titleRef ? -1 : undefined} className="type-section-title text-text-primary">
            {title}
          </h2>
          {children && <div className="flex flex-col gap-2 text-sm text-text-secondary">{children}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}
