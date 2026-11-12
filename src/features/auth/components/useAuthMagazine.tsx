import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { LoginMagazineProps } from "./LoginMagazine";

/** `lg` (64rem) — o mesmo corte em que o `AuthLayout` mostra a coluna editorial. */
const EDITORIAL_QUERY = "(min-width: 64rem)";

/** Sem rede para o pedaço da revista, fica só o papel (desktop) ou o fundo do tema (celular) — a tela segue igual. */
const LoginMagazine = lazy<ComponentType<LoginMagazineProps>>(() =>
  import("./LoginMagazine").catch(() => ({ default: () => null })),
);

/**
 * A revista Slow Garage, Edição 01 (ADR-104) em todas as telas de entrada
 * (entrar, cadastro, recuperar, confirmar e redefinir senha): no desktop, a coluna editorial inteira; abaixo
 * de `lg`, o fundo da tela, escurecido, atrás do cartão do formulário.
 * Devolve as props do `AuthLayout` (`editorial` ou `backdrop`). O código e as
 * fotos vêm por `lazy`, depois do formulário.
 */
export function useAuthMagazine(): { editorial?: ReactNode; backdrop?: ReactNode } {
  const showEditorial = useMediaQuery(EDITORIAL_QUERY);
  const magazine = (
    <Suspense fallback={showEditorial ? <div className="flex-1 bg-(--magazine-paper)" /> : null}>
      <LoginMagazine variant={showEditorial ? "panel" : "background"} />
    </Suspense>
  );
  return showEditorial ? { editorial: magazine } : { backdrop: magazine };
}
