import { useState } from "react";
import { Link } from "react-router-dom";
import { Car, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKm, formatMoney } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { VEHICLE_STATUS_LABELS } from "./schemas";
import { EditVehicleDialog } from "./EditVehicleDialog";
import { DeleteVehicleDialog } from "./DeleteVehicleDialog";
import type { VehicleWithSummary } from "./useVehicles";

type VehicleCardProps = {
  vehicle: VehicleWithSummary;
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const totalInvested = vehicle.financialSummary?.total_invested;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-150 hover:border-accent">
      <Link
        to={ROUTES.vehicle(vehicle.id)}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex h-40 items-center justify-center bg-bg">
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

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-text-primary">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-text-secondary">
                {vehicle.model_year}
                {vehicle.trim ? ` · ${vehicle.trim}` : ""}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-text-secondary">
              {VEHICLE_STATUS_LABELS[vehicle.status]}
            </span>
          </div>

          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-text-secondary">Km</dt>
              <dd className="text-text-primary">
                {vehicle.current_odometer_km != null ? formatKm(vehicle.current_odometer_km) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-text-secondary">Total investido</dt>
              <dd className="text-text-primary">
                {totalInvested != null ? formatMoney(totalInvested) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </Link>

      <div className="flex justify-end gap-2 p-4 pt-0">
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
