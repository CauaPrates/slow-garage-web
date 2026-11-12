import { AlertCircle } from "lucide-react";

type FieldErrorProps = {
  children?: string | null;
  /** Pra o campo apontar a mensagem via `aria-describedby`. */
  id?: string;
  /**
   * `false` quando o campo já aponta a mensagem via `aria-describedby` e o foco
   * vai pro primeiro campo inválido (etapa 03, `VehicleForm`): com `role="alert"`
   * também, o leitor de tela leria cada erro duas vezes — e todos de uma vez no
   * envio. O padrão continua `true` pros formulários que ainda dependem do alerta.
   */
  announce?: boolean;
};

/** Erro de campo/formulário anunciado por leitor de tela — nunca só cor: texto + ícone. */
export function FieldError({ children, id, announce = true }: FieldErrorProps) {
  if (!children) return null;
  return (
    <p
      id={id}
      role={announce ? "alert" : undefined}
      aria-live={announce ? "polite" : undefined}
      className="flex items-start gap-1.5 text-sm text-error"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
