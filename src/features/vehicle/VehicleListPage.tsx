import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { useVehicles } from "./useVehicles";
import { VehicleCard } from "./VehicleCard";
import { CreateVehicleDialog } from "./CreateVehicleDialog";
import { GarageDetails, GarageOverview } from "./GarageOverview";

const GRID_CLASSNAME =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] items-start gap-4 sm:gap-5";

/**
 * Recalibração visual 01 — Minha garagem como capa de revista + coleção.
 *
 * - Celular: título curto, "Cadastrar veículo" em largura cheia, faixa de três
 *   números e o primeiro carro logo em seguida. Nada de hero.
 * - Desktop (`lg`+): capa editorial compacta — sobrelinha "Minha garagem"
 *   (é o `h1`), chamada grande em fonte display, uma linha de apoio, a ação
 *   de cadastrar e, a partir de `xl`, os números da garagem ao lado. Sem foto
 *   de fundo: não há imagem editorial licenciada no projeto, e a foto do
 *   veículo do usuário já é protagonista no card.
 * - Veículos são a área principal; "Detalhes da garagem" (totais, gráficos,
 *   comparativo) fica recolhido depois da grade.
 *
 * Grade com card de no mínimo 19rem e largura máxima de 76rem: três colunas
 * de 1280 em diante (inclusive em telas largas, em vez de espalhar quatro ou
 * cinco cards finos), duas em notebook pequeno/tablet, uma no celular.
 */
export function VehicleListPage() {
  const { data: vehicles, isLoading, isError, refetch } = useVehicles();
  const { data: categories } = useExpenseCategories();
  const hasVehicles = !isLoading && !isError && vehicles && vehicles.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[76rem] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:gap-6 lg:px-8 lg:py-7 xl:gap-8 xl:py-8">
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:items-end xl:gap-10">
        <header className="flex flex-col gap-4 xl:gap-5">
          <div className="flex flex-col">
            <h1 className="font-display text-[1.875rem] leading-none font-extrabold tracking-tight text-text-primary lg:font-sans lg:text-xs lg:font-semibold lg:tracking-[0.2em] lg:text-text-secondary lg:uppercase">
              Minha garagem
            </h1>
            <p className="mt-1.5 text-[0.9375rem] text-text-secondary lg:mt-2.5 lg:font-display lg:text-[2.75rem] lg:leading-[0.95] lg:font-extrabold lg:tracking-[-0.01em] lg:text-text-primary lg:uppercase xl:text-[3.75rem]">
              Seus carros. <br className="hidden lg:block" />
              Suas histórias.
            </p>
            <p className="mt-4 hidden max-w-md text-base text-text-secondary xl:block">
              Gastos, manutenção e projetos de cada carro.
            </p>
          </div>
          {/* No estado vazio a chamada fica só no painel abaixo — uma por contexto. */}
          {hasVehicles && (
            <CreateVehicleDialog withIcon triggerClassName="w-full sm:w-fit sm:px-5" />
          )}
        </header>

        {hasVehicles && <GarageOverview vehicles={vehicles} />}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-6" aria-busy="true">
          <span className="sr-only">Carregando sua garagem…</span>
          <div className="h-20 animate-pulse rounded-lg bg-surface" aria-hidden="true" />
          <div className={GRID_CLASSNAME} aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-4/5 animate-pulse rounded-lg bg-surface" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">
            Não foi possível carregar sua garagem.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!isLoading && !isError && vehicles?.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-12 text-center">
          <div className="flex flex-col gap-1">
            <p className="font-medium text-text-primary">
              Nenhum veículo cadastrado ainda.
            </p>
            <p className="text-sm text-text-secondary">
              Cadastre o primeiro pra começar a registrar gastos,
              abastecimentos e manutenções.
            </p>
          </div>
          <CreateVehicleDialog triggerLabel="Cadastrar meu primeiro veículo" />
        </div>
      )}

      {hasVehicles && (
        <>
          <section aria-labelledby="garage-vehicles-title" className="flex flex-col gap-3 lg:gap-4">
            <h2
              id="garage-vehicles-title"
              className="flex items-baseline gap-2 font-display text-lg leading-tight font-bold tracking-tight text-text-primary lg:text-xl"
            >
              {vehicles.length === 1 ? "Seu veículo" : "Seus veículos"}
              {vehicles.length > 1 && (
                <span className="font-sans text-sm font-medium text-text-secondary tabular-nums">
                  ({vehicles.length})
                </span>
              )}
            </h2>
            <div className={GRID_CLASSNAME}>
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} categories={categories} />
              ))}
            </div>
          </section>

          <GarageDetails vehicles={vehicles} />
        </>
      )}
    </div>
  );
}
