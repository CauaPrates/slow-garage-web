import { useState } from "react";
import { Camera, Fuel, Receipt, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateExpenseDialog } from "@/features/expense/CreateExpenseDialog";
import type { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { CreateFuelLogDialog } from "@/features/fuel/CreateFuelLogDialog";
import { CreateMaintenanceRecordDialog } from "@/features/maintenance/CreateMaintenanceRecordDialog";
import { useMaintenanceItems } from "@/features/maintenance/useMaintenanceItems";
import type { Database } from "@/types/database.types";

type VehicleQuickActionsProps = {
  vehicleId: string;
  /** `id` do título do card — cada botão é descrito por ele, então o leitor de tela anuncia "Registrar gasto, Honda Civic Si" em vez de quatro "Registrar gasto" iguais na página. */
  vehicleNameId: string;
  categories: ReturnType<typeof useExpenseCategories>["data"];
  defaultFuelType: Database["public"]["Enums"]["fuel_type"];
  defaultOdometerKm?: number;
  /** O diálogo de foto mora no card: o placeholder "sem foto" abre o mesmo diálogo. */
  onAddPhoto: () => void;
};

const ACTION_BUTTON_CLASSNAME =
  "text-text-secondary hover:text-text-primary";

/**
 * Versão compacta do `QuickActionsRow` (Fase 13, `VehiclePage`) pra cada card
 * da "Minha Garagem" — ADR-053 supera a recusa do ADR-052 ("duplicaria a
 * VehiclePage"): com poucos veículos, o clique a mais pra entrar no veículo
 * só pra registrar o gasto mais comum é o próprio problema que o usuário
 * apontou. Cada diálogo só monta depois do primeiro clique no botão
 * correspondente (`everOpened`) — evita disparar `useMaintenanceItems` pra
 * todo veículo da lista de uma vez só (custaria N queries à toa).
 *
 * Redesign etapa 02: editar/excluir saíram desta faixa (foram pro menu "Mais
 * ações" do card) — aqui ficam só os registros do dia a dia.
 */
export function VehicleQuickActions({
  vehicleId,
  vehicleNameId,
  categories,
  defaultFuelType,
  defaultOdometerKm,
  onAddPhoto,
}: VehicleQuickActionsProps) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [maintenanceEverOpened, setMaintenanceEverOpened] = useState(false);

  const maintenanceItemsQuery = useMaintenanceItems(vehicleId, {
    enabled: maintenanceEverOpened,
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Registrar gasto"
        aria-describedby={vehicleNameId}
        title="Registrar gasto"
        className={ACTION_BUTTON_CLASSNAME}
        disabled={!categories}
        onClick={() => setExpenseOpen(true)}
      >
        <Receipt className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Registrar abastecimento"
        aria-describedby={vehicleNameId}
        title="Registrar abastecimento"
        className={ACTION_BUTTON_CLASSNAME}
        onClick={() => setFuelOpen(true)}
      >
        <Fuel className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Registrar manutenção"
        aria-describedby={vehicleNameId}
        title="Registrar manutenção"
        className={ACTION_BUTTON_CLASSNAME}
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
        aria-describedby={vehicleNameId}
        title="Adicionar foto"
        className={ACTION_BUTTON_CLASSNAME}
        onClick={onAddPhoto}
      >
        <Camera className="h-4 w-4" aria-hidden="true" />
      </Button>

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
    </>
  );
}
