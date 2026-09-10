import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";

type HeaderVehicleSwitcherProps = {
  vehicles: VehicleWithSummary[];
};

/**
 * Troca rápida de veículo sem precisar ir em "Minha garagem" — só
 * aparece com 2+ veículos cadastrados **e** dentro do contexto de um
 * veículo (`useCurrentVehicleId`, com a exceção de Configurações do
 * ADR-062/063); fora disso não há "veículo ativo" pra mostrar. Placa em
 * tag mono — mesmo padrão do `VehicleCard` (Fase 14e).
 */
export function HeaderVehicleSwitcher({ vehicles }: HeaderVehicleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentVehicleId = useCurrentVehicleId();
  const current = vehicles.find((v) => v.id === currentVehicleId);

  if (vehicles.length <= 1 || !current) return null;

  const others = vehicles.filter((v) => v.id !== current.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Trocar de veículo — atual: ${current.make} ${current.model}`}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-surface/60 px-3 text-sm text-text-primary backdrop-blur-sm transition-all duration-300 ease-[var(--ease-smooth)] hover:border-accent/40 hover:bg-surface hover:[box-shadow:0_0_12px_1px_color-mix(in_srgb,var(--color-accent)_12%,transparent)] sm:gap-2 sm:px-3.5"
        >
          <span className="hidden max-w-32 truncate font-medium sm:inline">
            {current.make} {current.model}
          </span>
          {current.plate && (
            <span className="shrink-0 rounded border border-border/60 bg-bg/80 px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wider whitespace-nowrap text-text-secondary">
              {current.plate}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-300 ease-[var(--ease-spring)]",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <p className="mb-2 text-xs font-medium tracking-wide text-text-secondary uppercase">
          Trocar de veículo
        </p>
        <div className="flex flex-col gap-1">
          {others.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(ROUTES.vehicle(vehicle.id));
              }}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-text-primary transition-[background-color,transform] duration-200 ease-[var(--ease-smooth)] hover:bg-bg active:scale-[0.98]"
            >
              <span className="truncate">
                {vehicle.make} {vehicle.model}
              </span>
              {vehicle.plate && (
                <span className="shrink-0 rounded-sm border border-border bg-bg px-1.5 py-0.5 font-mono text-xs tracking-wider text-text-secondary">
                  {vehicle.plate}
                </span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
