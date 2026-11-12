import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { ADD_SHEET_ITEMS } from "@/lib/navigation";
import { NavSheet } from "./NavSheet";

type AddActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Folha do botão "Registrar" (era "Adicionar" até a etapa 01) — o botão que abre esta folha já fica desabilitado sem
 * veículo selecionado (`BottomNav.tsx`), então todo item de `ADD_SHEET_ITEMS` sempre resolve uma rota. Cada item só
 * navega pra tela com `?novo=1`; quem abre o formulário é a própria tela — nada é criado direto daqui.
 */
export function AddActionSheet({ open, onOpenChange }: AddActionSheetProps) {
  const vehicleId = useCurrentVehicleId();

  return (
    <NavSheet
      title="Registrar"
      description="Escolha o que registrar no veículo aberto."
      actions={ADD_SHEET_ITEMS}
      vehicleId={vehicleId}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
