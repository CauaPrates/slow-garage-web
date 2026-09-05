import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { ADD_SHEET_ITEMS } from "@/lib/navigation";
import { NavSheet } from "./NavSheet";

type AddActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Folha do FAB "Adicionar" — o FAB que abre esta folha já fica desabilitado sem veículo selecionado (`BottomNav.tsx`), então todo item de `ADD_SHEET_ITEMS` sempre resolve uma rota. */
export function AddActionSheet({ open, onOpenChange }: AddActionSheetProps) {
  const vehicleId = useCurrentVehicleId();

  return (
    <NavSheet
      title="Adicionar"
      items={ADD_SHEET_ITEMS}
      vehicleId={vehicleId}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
