import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useVehicles } from "@/features/vehicle/useVehicles";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { HeaderAlertsMenu } from "./HeaderAlertsMenu";
import { HeaderActivityMenu } from "./HeaderActivityMenu";
import { HeaderVehicleSwitcher } from "./HeaderVehicleSwitcher";
import { HeaderUserMenu } from "./HeaderUserMenu";

/**
 * Fase 15e: no desktop (`lg`+) o shell tem a altura exata da viewport e não
 * rola — quem rola é o `<main>`. Antes a página inteira rolava e a sidebar,
 * por esticar junto com o conteúdo, empurrava "Configurações" pro fim de uma
 * página de 10.000px. Abaixo de `lg` nada muda: o documento continua rolando
 * (é o que faz a barra de endereço do navegador mobile se esconder, e não há
 * sidebar nesse tamanho pra ficar presa).
 */
export function AppShell() {
  const { data: vehicles } = useVehicles();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text-primary lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      {/*
        Fase 16: header premium — glassmorphism (backdrop-blur com
        transparência) substitui o border-b flat. A sombra difusa na base
        cria separação por "luz" em vez de linha, como um UINavigationBar
        do iOS. No mobile fica sticky pra o blur funcionar com o conteúdo
        rolando por baixo. O z-20 fica abaixo do z-30 do BottomNav e do
        z-50 dos modais/popovers.
      */}
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-bg/75 px-4 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300 sm:px-6 lg:relative lg:bg-bg/85 [box-shadow:0_1px_2px_0_rgb(0_0_0/0.05),0_1px_0_0_color-mix(in_srgb,var(--color-border)_40%,transparent)]">
        <Link
          to={ROUTES.home}
          className="group flex min-w-0 shrink items-center gap-2.5 rounded-lg py-1 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-3"
        >
          {/*
            A logo é colorida (preenchimento preto, contorno branco, estrela
            laranja), então não leva o filtro invert() do ícone monocromático
            anterior — inverter mataria o laranja da marca. O contorno branco
            a separa do fundo no dark; o preenchimento preto, no claro.
          */}
          <img
            src="/brand/logo-slow-garage.png"
            alt="Slow Garage Logo"
            aria-hidden="true"
            width={487}
            height={256}
            className="h-8 w-auto shrink-0 transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-105 sm:h-9"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-hero truncate text-lg font-bold tracking-widest text-text-primary uppercase transition-colors duration-200 group-hover:text-accent sm:text-xl">
              Garage
            </span>
            {/*
              Fase 16: a barra accent agora tem shimmer — um gradiente
              que percorre da esquerda pra direita uma única vez após o
              carregamento, simulando um reflexo de luz passando. Fica
              estático depois, sem loop infinito (não é loading state).
            */}
            <span
              className="h-0.5 w-7 animate-[shimmer_2s_ease-in-out_0.5s_1_forwards] rounded-full bg-accent transition-all duration-300 ease-[var(--ease-smooth)] group-hover:w-full"
              style={{
                backgroundImage: "linear-gradient(90deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 60%, white) 50%, var(--color-accent) 100%)",
                backgroundSize: "200% 100%",
              }}
              aria-hidden="true"
            />
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderVehicleSwitcher vehicles={vehicles ?? []} />

          {/* Fase 16: separador vertical entre contexto de veículo e ações globais */}
          <span className="mx-1 hidden h-5 w-px bg-gradient-to-b from-transparent via-border/80 to-transparent sm:block" aria-hidden="true" />

          <div className="lg:hidden">
            <HeaderActivityMenu vehicles={vehicles ?? []} />
          </div>
          <HeaderAlertsMenu vehicles={vehicles ?? []} />
          <HeaderUserMenu />
        </div>
      </header>
      <div className="flex flex-1 lg:min-h-0">
        <Sidebar vehicles={vehicles ?? []} />
        <main className="min-w-0 flex-1 pb-20 lg:overflow-y-auto lg:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
