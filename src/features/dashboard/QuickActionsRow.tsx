import { useState } from "react";
import { Camera, Fuel, Receipt, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateExpenseDialog } from "@/features/expense/CreateExpenseDialog";
import type { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { CreateFuelLogDialog } from "@/features/fuel/CreateFuelLogDialog";
import { CreateMaintenanceRecordDialog } from "@/features/maintenance/CreateMaintenanceRecordDialog";
import type { MaintenanceItemWithStatus } from "@/features/maintenance/useMaintenanceItems";
import { UploadPhotoDialog } from "@/features/document/UploadPhotoDialog";
import type { Database } from "@/types/database.types";

type QuickActionsRowProps = {
  vehicleId: string;
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  defaultFuelType: Database["public"]["Enums"]["fuel_type"];
  maintenanceItems: MaintenanceItemWithStatus[];
};

/** Fase 13: cada botão abre o diálogo já existente da entidade, direto por cima da VehiclePage — nunca navega (decisão do clarify). */
export function QuickActionsRow({
  vehicleId,
  categories,
  defaultFuelType,
  maintenanceItems,
}: QuickActionsRowProps) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Button variant="ghost" className="h-auto flex-col gap-1 border border-border py-3" onClick={() => setExpenseOpen(true)}>
        <Receipt className="h-5 w-5" aria-hidden="true" />
        Gasto
      </Button>
      <Button variant="ghost" className="h-auto flex-col gap-1 border border-border py-3" onClick={() => setFuelOpen(true)}>
        <Fuel className="h-5 w-5" aria-hidden="true" />
        Abastecimento
      </Button>
      <Button
        variant="ghost"
        className="h-auto flex-col gap-1 border border-border py-3"
        onClick={() => setMaintenanceOpen(true)}
      >
        <Wrench className="h-5 w-5" aria-hidden="true" />
        Manutenção
      </Button>
      <Button variant="ghost" className="h-auto flex-col gap-1 border border-border py-3" onClick={() => setPhotoOpen(true)}>
        <Camera className="h-5 w-5" aria-hidden="true" />
        Foto
      </Button>

      <CreateExpenseDialog
        vehicleId={vehicleId}
        categories={categories}
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
      />
      <CreateFuelLogDialog
        vehicleId={vehicleId}
        defaultFuelType={defaultFuelType}
        open={fuelOpen}
        onOpenChange={setFuelOpen}
      />
      <CreateMaintenanceRecordDialog
        vehicleId={vehicleId}
        items={maintenanceItems}
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
      />
      <UploadPhotoDialog vehicleId={vehicleId} open={photoOpen} onOpenChange={setPhotoOpen} />
    </div>
  );
}
