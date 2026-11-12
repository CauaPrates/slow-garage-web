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
  /**
   * Fundo de tela inteira abaixo de `lg` (o login usa a revista escurecida).
   * Com ele, marca, título e formulário vão para um cartão na superfície do
   * tema, legível sobre qualquer fundo.
   */
  backdrop?: ReactNode;
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
 * Com `editorial` (telas de entrada), a coluna esquerda tem a altura da janela, fica
 * parada (`sticky`) e é toda do conteúdo editorial, de borda a borda — a
 * revista é a superfície do painel e traz a própria marca no letreiro da capa.
 * Nada passa para o lado do formulário (`overflow-hidden`).
 *
 * Com `backdrop` (telas de entrada, abaixo de `lg`), o fundo ocupa a tela por trás
 * e o conteúdo vira um cartão de vidro fosco (translúcido, desfoque forte —
 * a revista aparece através dele); o espaço no topo fica livre para o
 * controle do fundo, no canto.
 */
export function AuthLayout({ title, description, children, editorial, backdrop }: AuthLayoutProps) {
  const content = (
    <>
      {/* Com a revista à esquerda, a marca fica também no desktop, acima do título (como no cartão do celular). */}
      <BrandLogo version={2} alt="Slow Garage" className={cn("h-9 self-start sm:h-10", !editorial && "lg:hidden")} />
      <header
        className={cn("mb-6 flex flex-col gap-2", backdrop ? "mt-6" : "mt-8 sm:mt-10", editorial ? "lg:mt-6" : "lg:mt-0")}
      >
        <h1 className="type-page-title text-text-primary">{title}</h1>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </header>
      {children}
    </>
  );
  return (
    <div
      className={cn(
        "min-h-dvh bg-bg lg:grid",
        // Com a revista (telas de entrada), a coluna editorial cede um pouco ao formulário (~48% em 1366); sem ela, a capa A3.1 fica como era.
        editorial ? "lg:grid-cols-[minmax(0,1fr)_minmax(28rem,1.1fr)]" : "lg:grid-cols-[minmax(0,1.15fr)_minmax(26rem,1fr)]",
      )}
    >
      {editorial ? (
        <div className="hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:self-start">{editorial}</div>
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

      {backdrop}
      <main
        className={cn(
          "flex min-h-dvh flex-col lg:border-l lg:border-border",
          // Com a revista: grafite com a luz âmbar da oficina vindo da divisória (magazine.css); sem ela, a superfície lisa.
          editorial ? "auth-panel-lit" : "lg:bg-surface",
          backdrop ? "relative bg-transparent" : "bg-bg",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pb-10 lg:justify-center lg:py-12",
            backdrop ? "justify-center pt-20" : "pt-6 sm:pt-10",
          )}
        >
          {backdrop ? (
            <div className="flex flex-col rounded-xl bg-(--auth-glass) p-5 shadow-(--shadow-overlay) backdrop-blur-2xl backdrop-saturate-150 sm:p-6">
              {content}
            </div>
          ) : (
            content
          )}
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
