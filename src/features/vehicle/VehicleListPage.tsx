import { useId, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { useVehicles } from "./useVehicles";
import { VehicleCard } from "./VehicleCard";
import { CreateVehicleDialog } from "./CreateVehicleDialog";
import { GarageCover } from "./GarageCover";
import { GarageDetails, GarageOverview } from "./GarageOverview";

/**
 * Minha garagem — Garagem A3 + capa A3.1 (ADR-094): composição de revista
 * automotiva japonesa traduzida em interface, sem caricatura e sem depender
 * de carro japonês.
 *
 * - Capa (`GarageCover`): compacta no celular; no desktop, página dupla com
 *   colagem fotográfica à direita.
 * - Resumo (`GarageOverview`): faixa de dados colada à capa, com
 *   "Detalhes e comparativo" — o painel (`GarageDetails`) abre logo abaixo.
 * - Coleção: "Seus veículos" com filete e contagem; 2 spreads por linha
 *   quando a coleção tem ≥ 1100 px, senão 1 (até 1000 px); 1 veículo vira um
 *   spread de destaque (até 1320 px).
 *
 * Capa, resumo e coleção começam na mesma margem depois da sidebar (40 px no
 * notebook, 56 px no largo), sem largura máxima nem centralização.
 */
export function VehicleListPage() {
  const { data: vehicles, isLoading, isError, refetch } = useVehicles();
  const { data: categories } = useExpenseCategories();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const hasVehicles = !isLoading && !isError && vehicles && vehicles.length > 0;

  return (
    <div className="garage-page">
      <GarageCover showCreate={Boolean(hasVehicles)} />

      {hasVehicles && (
        <>
          <GarageOverview
            vehicles={vehicles}
            details={{ open: detailsOpen, onToggle: () => setDetailsOpen((open) => !open), controlsId: detailsId }}
          />
          <GarageDetails vehicles={vehicles} id={detailsId} open={detailsOpen} />
        </>
      )}

      {isLoading && (
        <div className="garage-gutter flex flex-col gap-5 pt-1 lg:pt-0" aria-busy="true">
          <span className="sr-only">Carregando sua garagem…</span>
          <div className="h-14 animate-pulse rounded-sm bg-surface lg:h-18" aria-hidden="true" />
          <div className="garage-collection" aria-hidden="true">
            <div className="garage-grid">
              {[1, 2].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-sm bg-surface lg:h-64" />
              ))}
            </div>
          </div>
        </div>
      )}

      {isError && (
        <div className="garage-gutter pt-2">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
            <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Não foi possível carregar sua garagem.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && vehicles?.length === 0 && (
        <div className="garage-gutter pt-2">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-12 text-center">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-text-primary">Nenhum veículo cadastrado ainda.</p>
              <p className="text-sm text-text-secondary">
                Cadastre o primeiro pra começar a registrar gastos, abastecimentos e manutenções.
              </p>
            </div>
            <CreateVehicleDialog triggerLabel="Cadastrar meu primeiro veículo" />
          </div>
        </div>
      )}

      {hasVehicles && (
        <section aria-labelledby="garage-vehicles-title" className="garage-collection garage-gutter">
          <h2 id="garage-vehicles-title" className="garage-collection__title">
            {vehicles.length === 1 ? "Seu veículo" : "Seus veículos"}
            {vehicles.length > 1 && (
              <span className="garage-collection__count">
                <span aria-hidden="true">{String(vehicles.length).padStart(2, "0")}</span>
                <span className="sr-only">({vehicles.length})</span>
              </span>
            )}
          </h2>
          <div className="garage-grid">
            {vehicles.map((vehicle, index) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} categories={categories} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
