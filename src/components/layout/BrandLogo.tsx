import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** `full`: lettering completo (2 linhas). `symbol`: só os dois quadrados — assinatura compacta pra espaço apertado. */
  variant?: "full" | "symbol";
  /**
   * `2` é a marca da recalibração visual 01 (lettering encorpado e inclinado,
   * ✕ quadriculado laranja), usada pelo shell autenticado e, desde a etapa
   * 14, pelas telas de entrada (`AuthLayout`) — a mesma marca antes e depois
   * do login. A v1 continua no repositório (padrão do componente).
   */
  version?: 1 | 2;
  /** Vazio por padrão: quase sempre a marca está dentro de um link que já tem nome acessível próprio. */
  alt?: string;
  className?: string;
};

const LOGO_FILES = {
  1: { dark: "/brand/slow-garage-logo-dark.svg", light: "/brand/slow-garage-logo-light.svg", width: 320, height: 148 },
  2: { dark: "/brand/slow-garage-logo-v2-dark.svg", light: "/brand/slow-garage-logo-v2-light.svg", width: 594, height: 234 },
} as const;

/**
 * Marca vetorial (`public/brand/slow-garage-*.svg`). A versão do lettering
 * segue o tema **efetivamente aplicado** (`resolvedTheme`, que já resolve
 * "seguir o sistema") — marca clara no escuro, escura no claro. O símbolo é
 * só laranja e serve nos dois.
 *
 * Proporção é a do arquivo (`width`/`height` intrínsecos + `w-auto`): quem
 * usa define só a altura. Nada de recorte, filtro, sombra ou contorno — o
 * respiro já está no próprio `viewBox`.
 */
export function BrandLogo({ variant = "full", version = 1, alt = "", className }: BrandLogoProps) {
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

  const files = LOGO_FILES[version];
  return (
    <img
      src={resolvedTheme === "light" ? files.light : files.dark}
      alt={alt}
      width={files.width}
      height={files.height}
      className={cn("w-auto shrink-0", className)}
    />
  );
}
