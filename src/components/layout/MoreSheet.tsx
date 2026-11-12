import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { MORE_SHEET_GROUPS } from "@/lib/navigation";
import { NavSheet } from "./NavSheet";

type MoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Folha da aba "Mais" (bottom nav mobile, Fase 14g) — as 9 seções de veículo que não cabem nas abas fixas, nos mesmos grupos da sidebar (etapa 01). */
export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const vehicleId = useCurrentVehicleId();

  return (
    <NavSheet
      title="Seções do veículo"
      description="Todas as áreas do veículo aberto."
      groups={MORE_SHEET_GROUPS}
      vehicleId={vehicleId}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
