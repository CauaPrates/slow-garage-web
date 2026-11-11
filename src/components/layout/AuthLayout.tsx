import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { CoverImage } from "@/components/shared/CoverImage";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";

type AuthLayoutProps = {
  /** Nome fixo da tela ("Entrar", "Criar conta") — o `h1`, em display caixa-alta como as outras telas. */
  title: string;
  /** Uma frase do que acontece aqui. */
  description?: ReactNode;
  children: ReactNode;
  /**
   * Conteúdo da coluna editorial do desktop no lugar da chamada e da capa
   * (ADR-104: a revista do `/entrar`). Quem passa decide também quando montar
   * — abaixo de `lg` a coluna não aparece.
   */
  editorial?: ReactNode;
};

/**
 * Telas de entrada (login, cadastro, confirmação, recuperação e
 * redefinição) — sem o cabeçalho do AppShell, de propósito (RN-3 da spec
 * 001): a marca é o destaque. Sem controle de tema: antes do login vale a
 * preferência guardada neste aparelho ou, sem ela, o sistema operacional; a
 * escolha explícita vive em Configurações.
 *
 * Etapa 14: página dupla no idioma da Minha garagem (ADR-094), a mesma marca
 * v2 do shell (era a v1 desde a etapa 01).
 *
 * - Desktop (`lg`+): à esquerda, a coluna editorial — marca, a chamada da
 *   Garagem ("Seus carros. Suas histórias.") e a capa A3.1 enquadrada como
 *   foto de revista, nunca atrás de texto; à direita, o formulário sobre a
 *   superfície, com fio separando as duas páginas.
 * - Celular e tablet: marca pequena, título e formulário de cima pra baixo,
 *   sem foto (o `<picture>` não baixa a imagem abaixo de `lg`) — o primeiro
 *   campo aparece logo na primeira tela.
 *
 * Com `editorial` (só o login), a coluna esquerda tem a altura da janela e
 * fica parada (`sticky`): a revista se dimensiona pelo espaço que sobra
 * abaixo da marca e não depende da altura do formulário.
 */
export function AuthLayout({ title, description, children, editorial }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(26rem,1fr)]">
      {editorial ? (
        <div className="hidden flex-col gap-6 px-(--auth-gutter) py-8 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:self-start">
          <BrandLogo version={2} alt="Slow Garage" className="h-10 self-start" />
          <div className="flex min-h-0 flex-1">{editorial}</div>
        </div>
      ) : (
        <div className="hidden min-h-dvh flex-col justify-between gap-10 px-(--auth-gutter) py-10 lg:flex">
          <BrandLogo version={2} alt="Slow Garage" className="h-12 self-start" />
          <div className="flex w-full max-w-4xl flex-col gap-6">
            <p className="font-display text-(length:--auth-slogan-size) leading-[0.9] font-extrabold tracking-[-0.022em] text-text-primary uppercase">
              Seus carros.
              <br />
              Suas histórias.
            </p>
            <div aria-hidden="true" className="aspect-3/1 overflow-hidden rounded-lg border border-hairline-strong bg-surface">
              <CoverImage className="h-full w-full object-cover" />
            </div>
            <p className="max-w-[32ch] text-base text-text-secondary">
              Gastos, manutenção e projetos de cada carro, num lugar só.
            </p>
          </div>
          {/* Contrapeso da marca: mantém a chamada e a foto no meio da coluna. */}
          <span aria-hidden="true" className="h-12" />
        </div>
      )}

      <main className="flex min-h-dvh flex-col bg-bg lg:border-l lg:border-border lg:bg-surface">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-6 pb-10 sm:pt-10 lg:justify-center lg:py-12">
          <BrandLogo version={2} alt="Slow Garage" className="h-9 self-start sm:h-10 lg:hidden" />
          <header className="mt-8 mb-6 flex flex-col gap-2 sm:mt-10 lg:mt-0">
            <h1 className="type-page-title text-text-primary">{title}</h1>
            {description && <p className="text-sm text-text-secondary">{description}</p>}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}

type AuthAlternateProps = {
  /** "Ainda não tem conta?" */
  question: string;
  to: string;
  label: string;
};

/** O outro caminho (Entrar ↔ Criar conta, voltar para Entrar): separado do formulário por um fio, em contorno — nunca no laranja da ação principal. */
export function AuthAlternate({ question, to, label }: AuthAlternateProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
      <p className="text-sm text-text-secondary">{question}</p>
      <Link to={to} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
        {label}
      </Link>
    </div>
  );
}
