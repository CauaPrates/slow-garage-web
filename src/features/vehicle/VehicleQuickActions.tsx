import { useState } from "react";
import { Camera, Fuel, Pencil, Receipt, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateExpenseDialog } from "@/features/expense/CreateExpenseDialog";
import type { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { CreateFuelLogDialog } from "@/features/fuel/CreateFuelLogDialog";
import { CreateMaintenanceRecordDialog } from "@/features/maintenance/CreateMaintenanceRecordDialog";
import { useMaintenanceItems } from "@/features/maintenance/useMaintenanceItems";
import { UploadPhotoDialog } from "@/features/document/UploadPhotoDialog";
import type { Database } from "@/types/database.types";

type VehicleQuickActionsProps = {
  vehicleId: string;
  categories: ReturnType<typeof useExpenseCategories>["data"];
  defaultFuelType: Database["public"]["Enums"]["fuel_type"];
  defaultOdometerKm?: number;
  onEdit: () => void;
  onDelete: () => void;
};

/**
 * Versão compacta do `QuickActionsRow` (Fase 13, `VehiclePage`) pra cada linha
 * da "Minha Garagem" — ADR-053 supera a recusa do ADR-052 ("duplicaria a
 * VehiclePage"): com poucos veículos, o clique a mais pra entrar no veículo
 * só pra registrar o gasto mais comum é o próprio problema que o usuário
 * apontou. Cada diálogo só monta depois do primeiro clique no botão
 * correspondente (`everOpened`) — evita disparar `useMaintenanceItems` pra
 * todo veículo da lista de uma vez só (custaria N queries à toa).
 */
export function VehicleQuickActions({
  vehicleId,
  categories,
  defaultFuelType,
  defaultOdometerKm,
  onEdit,
  onDelete,
}: VehicleQuickActionsProps) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [maintenanceEverOpened, setMaintenanceEverOpened] = useState(false);

  const maintenanceItemsQuery = useMaintenanceItems(vehicleId, {
    enabled: maintenanceEverOpened,
  });

  return (
    <div className="flex items-center gap-1 border-t border-border p-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Registrar gasto"
        disabled={!categories}
        onClick={() => setExpenseOpen(true)}
      >
        <Receipt className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Registrar abastecimento"
        onClick={() => setFuelOpen(true)}
      >
        <Fuel className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Registrar manutenção"
        onClick={() => {
          setMaintenanceEverOpened(true);
          setMaintenanceOpen(true);
        }}
      >
        <Wrench className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Adicionar foto"
        onClick={() => setPhotoOpen(true)}
      >
        <Camera className="h-4 w-4" aria-hidden="true" />
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar veículo"
          className="text-accent hover:bg-accent/10 hover:text-accent"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir veículo"
          className="text-error hover:bg-error/10 hover:text-error"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {categories && (
        <CreateExpenseDialog
          vehicleId={vehicleId}
          categories={categories}
          defaultOdometerKm={defaultOdometerKm}
          open={expenseOpen}
          onOpenChange={setExpenseOpen}
        />
      )}
      <CreateFuelLogDialog
        vehicleId={vehicleId}
        defaultFuelType={defaultFuelType}
        open={fuelOpen}
        onOpenChange={setFuelOpen}
      />
      {maintenanceEverOpened && (
        <CreateMaintenanceRecordDialog
          vehicleId={vehicleId}
          items={maintenanceItemsQuery.data ?? []}
          defaultOdometerKm={defaultOdometerKm}
          open={maintenanceOpen}
          onOpenChange={setMaintenanceOpen}
        />
      )}
      <UploadPhotoDialog
        vehicleId={vehicleId}
        open={photoOpen}
        onOpenChange={setPhotoOpen}
      />
    </div>
  );
}
