import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { ROUTES } from "@/lib/routes";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";
import { NAV_EYEBROW_CLASSNAME } from "./navStyles";

type HeaderVehicleSwitcherProps = {
  vehicles: VehicleWithSummary[];
};

function PlateTag({ plate }: { plate: string }) {
  return (
    <span className="shrink-0 rounded-sm border border-border px-1.5 py-px font-mono text-[11px] tracking-wider whitespace-nowrap text-text-secondary">
      {plate}
    </span>
  );
}

/**
 * Troca rápida de veículo sem precisar ir em "Minha garagem" — só
 * aparece com 2+ veículos cadastrados **e** dentro do contexto de um
 * veículo (`useCurrentVehicleId`, com a exceção de Configurações do
 * ADR-062/063); fora disso não há "veículo ativo" pra mostrar. Placa em
 * tag mono — mesmo padrão do `VehicleCard` (Fase 14e).
 *
 * Etapa 01: nome longo trunca dentro do gatilho (`min-w-0`) em vez de
 * empurrar os utilitários do cabeçalho; abaixo de `sm` some o nome e fica
 * placa + ícone, com o nome completo no `aria-label`.
 */
export function HeaderVehicleSwitcher({ vehicles }: HeaderVehicleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentVehicleId = useCurrentVehicleId();
  const current = vehicles.find((v) => v.id === currentVehicleId);

  if (vehicles.length <= 1 || !current) return null;

  const others = vehicles.filter((v) => v.id !== current.id);
  const currentName = `${current.make} ${current.model}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Trocar de veículo — atual: ${currentName}`}
          title={currentName}
          className="flex h-11 max-w-full min-w-0 items-center gap-2 lg:max-w-md rounded-md border border-border px-2.5 text-sm text-text-primary transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-state-hover data-[state=open]:bg-state-active sm:px-3"
        >
          <span className="hidden min-w-0 truncate font-medium sm:inline">{currentName}</span>
          {current.plate && <PlateTag plate={current.plate} />}
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <p className={`${NAV_EYEBROW_CLASSNAME} mb-2 px-2`}>Trocar de veículo</p>
        <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          {others.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(ROUTES.vehicle(vehicle.id));
              }}
              className="flex min-h-11 items-center justify-between gap-3 rounded-md px-2 text-left text-sm text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
            >
              <span className="min-w-0 truncate">
                {vehicle.make} {vehicle.model}
              </span>
              {vehicle.plate && <PlateTag plate={vehicle.plate} />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
