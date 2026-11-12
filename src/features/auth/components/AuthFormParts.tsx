import { useCallback, useRef, useState, type ReactNode } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { PASSWORD_MIN_LENGTH } from "../schemas";

/**
 * Etapa 14 — peças dos formulários de conta (entrar, criar conta, recuperar,
 * redefinir, trocar senha e nome). Só forma e acessibilidade: schema,
 * chamadas ao Supabase e destinos continuam em cada formulário.
 */

/**
 * Teclado e preenchimento de campo de e-mail: teclado de e-mail no celular,
 * sem maiúscula automática nem corretor (o corretor trocava "gmial" por
 * "gmail" depois de a pessoa já ter revisado). O `autoComplete` fica em cada
 * campo: `username` no login (o par que o gerenciador de senha salva),
 * `email` no cadastro e na recuperação.
 */
export const EMAIL_FIELD_PROPS = {
  type: "email",
  inputMode: "email",
  autoCapitalize: "none",
  autoCorrect: "off",
  spellCheck: false,
} as const;

/**
 * Envio que nunca roda duas vezes: dois Enter seguidos, ou Enter + clique,
 * chegam aqui antes de o estado re-renderizar — a trava em `ref` barra o
 * segundo. O botão não fica `disabled` (fica `aria-disabled`): desabilitado,
 * ele perdia o foco pro `<body>` no meio do envio, e quem usa teclado ou
 * leitor de tela voltava pro começo da página depois de um erro.
 */
export function useGuardedSubmit() {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const run = useCallback(async (task: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setPending(true);
    try {
      await task();
    } finally {
      running.current = false;
      setPending(false);
    }
  }, []);
  return { pending, run };
}

type SubmitButtonProps = {
  pending: boolean;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "outline";
  className?: string;
};

/** Ação principal do formulário: diz o que está acontecendo enquanto envia ("Entrando…") e ignora o segundo envio. */
export function SubmitButton({ pending, label, pendingLabel, variant = "primary", className }: SubmitButtonProps) {
  return (
    <Button type="submit" variant={variant} aria-disabled={pending || undefined} className={className}>
      {pending && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : label}
    </Button>
  );
}

/** Falha do envio (não de um campo): logo acima da ação, anunciada uma vez, com o que foi digitado preservado no formulário. */
export function SubmitError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <Alert tone="error" role="alert">
      {children}
    </Alert>
  );
}

/**
 * Requisito da senha nova, à vista antes de digitar — o mesmo número do
 * schema (`PASSWORD_MIN_LENGTH`). Muda de ícone quando é atendido; o leitor
 * de tela ouve o estado junto da descrição do campo, sem anúncio a cada
 * tecla.
 */
export function PasswordRule({ value }: { value: string | undefined }) {
  const met = (value?.length ?? 0) >= PASSWORD_MIN_LENGTH;
  const Icon = met ? Check : Circle;
  return (
    <span className="flex items-center gap-1.5">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", met ? "text-success" : "text-text-muted")} aria-hidden="true" />
      <span>
        Pelo menos {PASSWORD_MIN_LENGTH} caracteres
        <span className="sr-only">{met ? " (atendido)" : " (ainda não atendido)"}</span>
      </span>
    </span>
  );
}
