import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { useVehicles } from "./useVehicles";
import { VehicleCard } from "./VehicleCard";
import { CreateVehicleDialog } from "./CreateVehicleDialog";
import { GarageOverview } from "./GarageOverview";

/**
 * Redesign etapa 02: cabeçalho curto, resumo operacional compacto e a grade
 * de veículos logo em seguida — os veículos são o assunto da página. O
 * detalhamento financeiro e o comparativo moram recolhidos dentro do resumo
 * (`GarageOverview`), na mesma rota.
 *
 * Grade: `auto-fill` com mínimo de 20rem por card. Três colunas só aparecem
 * quando cabem três cards de 20rem (desktop largo); em larguras
 * intermediárias caem pra duas e, no celular, pra uma — sem breakpoint fixo
 * que espremeria o card numa sidebar aberta.
 */
export function VehicleListPage() {
  const { data: vehicles, isLoading, isError, refetch } = useVehicles();
  const { data: categories } = useExpenseCategories();
  const hasVehicles = !isLoading && !isError && vehicles && vehicles.length > 0;

  return (
    <div className="flex flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6">
      <header className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Minha garagem
          </h1>
          <p className="text-sm text-text-secondary">
            Seus carros. Suas histórias.
          </p>
        </div>
        {/* No estado vazio a chamada fica só no painel abaixo — uma por contexto. */}
        {hasVehicles && (
          <div className="shrink-0">
            <CreateVehicleDialog compactOnMobile />
          </div>
        )}
      </header>

      {isLoading && (
        <div className="flex flex-col gap-6" aria-busy="true">
          <span className="sr-only">Carregando sua garagem…</span>
          <div
            className="h-24 animate-pulse rounded-lg border border-border bg-surface"
            aria-hidden="true"
          />
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-5"
            aria-hidden="true"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-4/5 animate-pulse rounded-lg border border-border bg-surface"
              />
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
          <GarageOverview vehicles={vehicles} />

          <section aria-labelledby="garage-vehicles-title" className="flex flex-col gap-3">
            <h2
              id="garage-vehicles-title"
              className="text-xs font-medium tracking-[0.08em] text-text-secondary uppercase"
            >
              {vehicles.length === 1 ? "Seu veículo" : `Seus veículos (${vehicles.length})`}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] items-start gap-5">
              {vehicles.map((vehicle, index) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  bayNumber={index + 1}
                  categories={categories}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
