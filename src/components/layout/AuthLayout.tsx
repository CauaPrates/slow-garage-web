import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

/**
 * Layout full-bleed das telas de auth — sem o header do AppShell, de
 * propósito (RN-3 da spec 001): o wordmark hero é o único destaque
 * visual aqui, sem competir com cromo persistente. Sem controle de tema
 * também: antes do login o tema segue o sistema operacional, e a escolha
 * explícita vive só em Configurações (`ThemePreferenceSelect`).
 */
export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-hero text-center text-5xl font-bold tracking-wide text-text-primary uppercase">
            Slow Garage
          </h1>
          <span className="h-0.5 w-16 bg-accent" aria-hidden="true" />
        </div>
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
