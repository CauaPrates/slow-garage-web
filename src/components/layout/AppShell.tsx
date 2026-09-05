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
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
        <Link
          to={ROUTES.home}
          className="flex min-w-0 shrink items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-3"
        >
          {/*
            Fase 15g: o `icon-192.png` é um lockup largo (arte de 152x88 num
            canvas de 192x192 — medido, não estimado): 10% de margem morta de
            cada lado e ~27% em cima e embaixo. Encaixado num quadro quadrado
            sem zoom, a arte visível ficava em 22x13px dentro de 44px — daí a
            sensação de logo minúscula por mais que o quadro crescesse. O
            `scale-[1.1]` come essa margem e o quadro cresceu 36→44 (mobile,
            sem mexer na altura do cabeçalho, que já é ditada pelos botões de
            44px) e 44→56 (sm+) — a arte visível sai de 22x13px pra 49x28px.
            Não vai além de 1.1: a 1.2 a arte encosta na borda e o
            `rounded-md` come a ponta do "S" e a bandeira quadriculada
            (conferido em captura ampliada, não no olho). O `bg-accent/5` da
            moldura (ADR-066) fica coberto pela marca agora — continua ali
            como estado de carregamento/falha da imagem, não como decoração
            visível; o âmbar da moldura quem carrega é a borda.
          */}
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-accent/40 bg-accent/5 sm:h-14 sm:w-14">
            <img
              src="/icons/icon-192.png"
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-[1.1]"
            />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-base font-bold tracking-wide text-text-primary uppercase sm:text-lg">
              Slow Garage
            </span>
            <span className="h-0.5 w-8 bg-accent" aria-hidden="true" />
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <HeaderVehicleSwitcher vehicles={vehicles ?? []} />
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
