import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

/**
 * Layout full-bleed das telas de auth — sem o header do AppShell, de
 * propósito (RN-3 da spec 001): a marca é o único destaque visual aqui, sem
 * competir com cromo persistente. Sem controle de tema também: antes do
 * login o tema segue o sistema operacional, e a escolha explícita vive só
 * em Configurações (`ThemePreferenceSelect`).
 *
 * Etapa 01: o wordmark em Rajdhani deu lugar à marca vetorial
 * (`BrandLogo`), que já traz o laranja nos dois quadrados — o traço âmbar
 * de baixo saiu pra não repetir o acento. Continua sendo o `h1` da tela.
 */
export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <h1>
          <BrandLogo alt="Slow Garage" className="h-24 sm:h-28" />
        </h1>
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-6 text-lg font-medium text-text-primary">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}
