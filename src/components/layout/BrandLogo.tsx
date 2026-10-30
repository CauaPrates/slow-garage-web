import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** `full`: lettering completo (2 linhas). `symbol`: só os dois quadrados — assinatura compacta pra espaço apertado. */
  variant?: "full" | "symbol";
  /** Vazio por padrão: quase sempre a marca está dentro de um link que já tem nome acessível próprio. */
  alt?: string;
  className?: string;
};

/**
 * Marca vetorial v1 (`public/brand/slow-garage-*.svg`, etapa 01). A versão
 * do lettering segue o tema **efetivamente aplicado** (`resolvedTheme`,
 * que já resolve "seguir o sistema") — marca clara no escuro, escura no
 * claro. O símbolo é só laranja e serve nos dois.
 *
 * Proporção é a do arquivo (`width`/`height` intrínsecos + `w-auto`): quem
 * usa define só a altura. Nada de recorte, filtro, sombra ou contorno — o
 * respiro já está no próprio `viewBox`.
 */
export function BrandLogo({ variant = "full", alt = "", className }: BrandLogoProps) {
  const { resolvedTheme } = useTheme();

  if (variant === "symbol") {
    return (
      <img
        src="/brand/slow-garage-symbol.svg"
        alt={alt}
        width={64}
        height={64}
        className={cn("w-auto shrink-0", className)}
      />
    );
  }

  return (
    <img
      src={resolvedTheme === "light" ? "/brand/slow-garage-logo-light.svg" : "/brand/slow-garage-logo-dark.svg"}
      alt={alt}
      width={320}
      height={148}
      className={cn("w-auto shrink-0", className)}
    />
  );
}
