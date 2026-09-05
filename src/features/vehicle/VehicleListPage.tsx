import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVehicles } from "./useVehicles";
import { VehicleCard } from "./VehicleCard";
import { CreateVehicleDialog } from "./CreateVehicleDialog";
import { GarageSummary } from "./GarageSummary";

export function VehicleListPage() {
  const { data: vehicles, isLoading, isError, refetch } = useVehicles();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-medium text-text-primary">
          Minha Garagem
        </h1>
        {vehicles && vehicles.length > 0 && <CreateVehicleDialog />}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">
            Não foi possível carregar sua garagem.
          </p>
          <Button variant="ghost" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!isLoading && !isError && vehicles?.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-text-primary">Nenhum veículo cadastrado ainda.</p>
          <CreateVehicleDialog triggerLabel="Cadastrar meu primeiro veículo" />
        </div>
      )}

      {!isLoading && !isError && vehicles && vehicles.length >= 2 && (
        <GarageSummary vehicles={vehicles} />
      )}

      {!isLoading && !isError && vehicles && vehicles.length > 0 && (
        <div className="flex flex-col gap-4">
          {vehicles.map((vehicle, index) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} bayNumber={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
