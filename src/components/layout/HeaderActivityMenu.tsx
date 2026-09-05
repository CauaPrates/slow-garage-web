import { History } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { TimelineItem } from "@/features/timeline/TimelineItem";
import { useGarageTimeline } from "@/features/vehicle/useGarageTimeline";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";

type HeaderActivityMenuProps = {
  vehicles: VehicleWithSummary[];
};

/**
 * Fase 15: mesma posição de "olhar rápido" do `HeaderAlertsMenu` (ícone +
 * popover no cabeçalho), agora para a atividade recente que antes só
 * aparecia como card em "Minha Garagem" (`GarageActivityFeed`, removido) —
 * o usuário pediu explicitamente que não fosse mais uma página/aba, e sim
 * algo acessível de qualquer tela. Mesma fonte de dado e mesmo limite de 8
 * eventos que o card antigo usava (`useGarageTimeline`), sem mudança de
 * query.
 */
export function HeaderActivityMenu({ vehicles }: HeaderActivityMenuProps) {
  const feedQuery = useGarageTimeline(vehicles.map((v) => v.id));
  const vehicleLabelById = new Map(
    vehicles.map((v) => [v.id, `${v.make} ${v.model}`]),
  );
  const showVehicleLabel = vehicles.length > 1;

  if (vehicles.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Atividade recente">
          <History className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <h2 className="mb-3 text-sm font-medium text-text-primary">
          Atividade recente
        </h2>

        {feedQuery.isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-bg" />
            ))}
          </div>
        )}

        {feedQuery.isError && (
          <p className="text-sm text-text-secondary">
            Não foi possível carregar a atividade recente.
          </p>
        )}

        {feedQuery.data && feedQuery.data.length === 0 && (
          <p className="text-sm text-text-secondary">
            Nenhuma atividade registrada ainda. Registre um gasto, abastecimento
            ou manutenção pra começar.
          </p>
        )}

        {feedQuery.data && feedQuery.data.length > 0 && (
          <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
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
      </PopoverContent>
    </Popover>
  );
}
