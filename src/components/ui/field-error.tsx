import { AlertCircle } from "lucide-react";

/** Erro de campo/formulário anunciado por leitor de tela — nunca só cor: texto + ícone. */
export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="alert" aria-live="polite" className="flex items-start gap-1.5 text-sm text-error">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
