import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
};

/**
 * Layout full-bleed das telas de auth — sem o header do AppShell, de
 * propósito (RN-3 da spec 001): o wordmark hero é o único destaque
 * visual aqui, sem competir com cromo persistente.
 */
export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 py-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <h1 className="font-hero text-center text-4xl text-text-primary">
          Slow Garage
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
