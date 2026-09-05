import { useState } from "react";
import { Link } from "react-router-dom";
import { Car, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKm, formatMoney } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS, VEHICLE_STATUS_LABELS } from "./schemas";
import { EditVehicleDialog } from "./EditVehicleDialog";
import { DeleteVehicleDialog } from "./DeleteVehicleDialog";
import { VehicleQuickActions } from "./VehicleQuickActions";
import type { VehicleWithSummary } from "./useVehicles";

type VehicleCardProps = {
  vehicle: VehicleWithSummary;
  /** Número da baia (1-based) — mostrado tipo placa de vaga de oficina, não é um dado do banco. */
  bayNumber: number;
  /** Buscado uma vez só em `VehicleListPage` (categoria não é por veículo) — repassado pra cada linha. */
  categories: ReturnType<typeof useExpenseCategories>["data"];
};

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="font-mono text-text-primary">{value}</dd>
    </div>
  );
}

/** Fase 14c: cada veículo é uma "baia de oficina" — linha larga com foto, número da vaga e ficha técnica, não mais um card de admin genérico. */
export function VehicleCard({ vehicle, bayNumber, categories }: VehicleCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const totalInvested = vehicle.financialSummary?.total_invested;
  const costPerKm = vehicle.financialSummary?.cost_per_km;
  const specChips = [
    vehicle.engine_description,
    TRANSMISSION_LABELS[vehicle.transmission],
    vehicle.horsepower != null ? `${vehicle.horsepower} cv` : null,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-150 hover:border-accent">
      <div className="flex flex-col sm:flex-row">
        <Link
          to={ROUTES.vehicle(vehicle.id)}
          className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row"
        >
          <div className="relative flex h-40 shrink-0 items-center justify-center bg-accent/5 sm:h-auto sm:w-56">
            <span className="absolute top-2 left-2 rounded-sm border border-accent/40 bg-bg/80 px-1.5 py-0.5 font-mono text-xs text-accent">
              baia {String(bayNumber).padStart(2, "0")}
            </span>
            {vehicle.photoUrl ? (
              <img
                src={vehicle.photoUrl}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Car className="h-10 w-10 text-text-secondary" aria-hidden="true" />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-text-primary">
                    {vehicle.make} {vehicle.model}
                  </p>
                  {vehicle.plate && (
                    <span className="rounded-sm border border-border bg-bg px-1.5 py-0.5 font-mono text-xs tracking-wider text-text-secondary">
                      {vehicle.plate}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary">
                  {vehicle.model_year}
                  {vehicle.trim ? ` · ${vehicle.trim}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-sm border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                  vehicle.status === "active"
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-text-secondary",
                )}
              >
                {VEHICLE_STATUS_LABELS[vehicle.status]}
              </span>
            </div>

            {specChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {specChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-sm border border-border px-1.5 py-0.5 text-xs text-text-secondary"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}

            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-4">
              <Spec
                label="Km"
                value={vehicle.current_odometer_km != null ? formatKm(vehicle.current_odometer_km) : "—"}
              />
              <Spec label="Custo/km" value={costPerKm != null ? `${formatMoney(costPerKm)}/km` : "—"} />
              <Spec
                label="Total investido"
                value={totalInvested != null ? formatMoney(totalInvested) : "—"}
              />
              <Spec label="Combustível" value={FUEL_TYPE_LABELS[vehicle.fuel_type]} />
            </dl>
          </div>
        </Link>

        <div className="flex shrink-0 gap-2 p-4 pt-0 sm:flex-col sm:pt-4 sm:pl-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar veículo"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir veículo"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <VehicleQuickActions
        vehicleId={vehicle.id}
        categories={categories}
        defaultFuelType={vehicle.fuel_type}
        defaultOdometerKm={vehicle.current_odometer_km ?? undefined}
      />

      <EditVehicleDialog
        vehicle={vehicle}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteVehicleDialog
        vehicle={vehicle}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
