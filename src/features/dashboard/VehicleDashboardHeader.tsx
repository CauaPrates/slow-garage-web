import { useRef, useState } from "react";
import { Car, ImageOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlashOnChange } from "@/hooks/useFlashOnChange";
import { formatKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EditVehicleDialog } from "@/features/vehicle/EditVehicleDialog";
import { VEHICLE_STATUS_LABELS } from "@/features/vehicle/schemas";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";

type VehicleDashboardHeaderProps = {
  vehicle: VehicleWithSummary;
};

/** Miniatura 4:3 (a proporção do recorte, ADR-081) — nunca a foto de largura inteira antes dos indicadores. */
function Thumbnail({ photoUrl }: { photoUrl: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = photoUrl != null && failedUrl === photoUrl;

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-md border border-border bg-bg sm:row-span-2">
      {photoUrl && !failed ? (
        // O nome já está no `h1` ao lado: alt vazio evita ler o nome duas vezes.
        <img
          src={photoUrl}
          alt=""
          onError={() => setFailedUrl(photoUrl)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
          {failed ? (
            <ImageOff className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          ) : (
            <Car className="h-5 w-5 text-border-strong sm:h-7 sm:w-7" aria-hidden="true" />
          )}
          <span className="text-[11px] leading-tight text-text-secondary">
            {failed ? "Foto indisponível" : "Sem foto"}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Etapa 04: identificação compacta do veículo. Nome completo no `h1` (marca
 * em sobrelinha, modelo como título — mesmo desenho do card da garagem),
 * quebra linha em vez de cortar e nunca empurra status/km/ação: esses moram
 * na linha de baixo, que no celular ocupa a largura toda.
 */
export function VehicleDashboardHeader({ vehicle }: VehicleDashboardHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const editRef = useRef<HTMLButtonElement>(null);
  // Sistema de resposta: km novo depois de um abastecimento/manutenção registrado pisca (a página monta por veículo, então a troca não pisca).
  const odometerFlashing = useFlashOnChange(vehicle.current_odometer_km);
  const details = [vehicle.model_year, vehicle.trim].filter((part) => part != null && part !== "");

  return (
    <header className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-x-5 sm:p-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <Thumbnail photoUrl={vehicle.photoUrl} />

      <div className="flex min-w-0 flex-col gap-1 self-center sm:self-end">
        <h1 className="text-lg leading-tight font-semibold tracking-tight break-words text-text-primary sm:text-2xl">
          <span className="block text-[11px] font-medium tracking-[0.08em] text-text-secondary uppercase sm:text-xs">
            {vehicle.make}
          </span>{" "}
          {vehicle.model}
        </h1>
        {(details.length > 0 || vehicle.plate) && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
            {details.length > 0 && <span>{details.join(" · ")}</span>}
            {vehicle.plate && (
              <span className="rounded-sm border border-border px-1.5 py-px font-mono text-[11px] tracking-wider whitespace-nowrap">
                <span className="sr-only">Placa </span>
                {vehicle.plate}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-1 sm:col-start-2 sm:self-start">
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
            vehicle.status === "active" ? "border-accent/40 text-accent" : "border-border text-text-secondary",
          )}
        >
          <span className="sr-only">Status: </span>
          {VEHICLE_STATUS_LABELS[vehicle.status]}
        </span>
        <p className="flex items-baseline gap-1.5 text-sm">
          <span className="text-text-secondary">Odômetro</span>
          <span
            className={cn(
              "rounded-sm font-mono font-medium text-text-primary",
              odometerFlashing && "motion-safe:animate-value-flash",
            )}
          >
            {vehicle.current_odometer_km != null ? formatKm(vehicle.current_odometer_km) : "—"}
          </span>
          {vehicle.current_odometer_km == null && (
            <span className="text-xs text-text-secondary">não informado</span>
          )}
        </p>
        {/* Abaixo de `sm` só o lápis (44×44, com nome acessível): com nome longo, o rótulo jogava o botão pra uma linha própria. */}
        <Button
          ref={editRef}
          variant="outline"
          className="ml-auto w-11 px-0 sm:w-auto sm:px-3"
          aria-label="Editar veículo"
          title="Editar veículo"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Editar veículo</span>
        </Button>
      </div>

      <EditVehicleDialog
        vehicle={vehicle}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) requestAnimationFrame(() => editRef.current?.focus());
        }}
      />
    </header>
  );
}
