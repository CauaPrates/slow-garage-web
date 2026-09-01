/** Erro de campo/formulário anunciado por leitor de tela — nunca só cor. */
export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="alert" aria-live="polite" className="text-sm text-error">
      {children}
    </p>
  );
}
