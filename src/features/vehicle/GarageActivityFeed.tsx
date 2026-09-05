import { TimelineItem } from "@/features/timeline/TimelineItem";
import { useGarageTimeline } from "./useGarageTimeline";
import type { VehicleWithSummary } from "./useVehicles";

type GarageActivityFeedProps = {
  vehicles: VehicleWithSummary[];
};

/**
 * ADR-053: junta a timeline de todos os veículos, mesmo componente
 * (`TimelineItem`) que a `VehiclePage` já usa pra "Recente" — poupa o
 * clique de entrar em cada veículo só pra ver o que rolou por último.
 * Aparece com 1 veículo só também (diferente do `GarageSummary`, que é
 * número e duplicaria o resumo do próprio veículo): aqui o ganho é não
 * precisar navegar, não um dado novo.
 */
export function GarageActivityFeed({ vehicles }: GarageActivityFeedProps) {
  const feedQuery = useGarageTimeline(vehicles.map((v) => v.id));
  const vehicleLabelById = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model}`]));
  const showVehicleLabel = vehicles.length > 1;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-medium text-text-primary">Atividade recente</h2>

      {feedQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-bg" />
          ))}
        </div>
      )}

      {feedQuery.isError && (
        <p className="text-sm text-text-secondary">Não foi possível carregar a atividade recente.</p>
      )}

      {feedQuery.data && feedQuery.data.length === 0 && (
        <p className="text-sm text-text-secondary">
          Nenhuma atividade registrada ainda. Registre um gasto, abastecimento ou manutenção pra
          começar.
        </p>
      )}

      {feedQuery.data && feedQuery.data.length > 0 && (
        <div className="flex flex-col gap-2">
          {feedQuery.data.map((event) => (
            <div key={`${event.source_table}-${event.source_id}`}>
              {showVehicleLabel && (
                <p className="pb-1 text-xs font-medium tracking-wide text-text-secondary uppercase">
                  {vehicleLabelById.get(event.vehicle_id) ?? ""}
                </p>
              )}
              <TimelineItem vehicleId={event.vehicle_id} event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
