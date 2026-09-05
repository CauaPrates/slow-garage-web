import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { MORE_SHEET_ITEMS } from "@/lib/navigation";
import { NavSheet } from "./NavSheet";

type MoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Folha da aba "Mais" (bottom nav mobile, Fase 14g) — as seções de veículo (Gastos, Abastecimentos, Manutenção, Problemas, Projetos, Documentos) que não cabem nas 4 abas fixas. */
export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const vehicleId = useCurrentVehicleId();

  return (
    <NavSheet
      title="Mais"
      items={MORE_SHEET_ITEMS}
      vehicleId={vehicleId}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
