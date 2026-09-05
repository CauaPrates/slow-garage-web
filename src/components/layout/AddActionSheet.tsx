import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { ADD_SHEET_ITEMS, resolveNavItem } from "@/lib/navigation";

type AddActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Folha do botão "Adicionar" — usa o Dialog (Radix) já instalado, só com
 * posicionamento próprio na base da tela, em vez de instalar uma lib de
 * bottom-sheet (ver plan.md da Fase 3, alternativas descartadas). Fase 14:
 * o FAB que abre esta folha já fica desabilitado sem veículo selecionado
 * (`BottomNav.tsx`), então todo item aqui sempre resolve uma rota — sem
 * branch de item desabilitado.
 */
export function AddActionSheet({ open, onOpenChange }: AddActionSheetProps) {
  const vehicleId = useCurrentVehicleId();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <DialogPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-lg border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg transition-[opacity,transform] duration-150 focus:outline-none data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100"
        >
          <div className="mb-3 flex items-center justify-between">
            <DialogPrimitive.Title className="text-base font-medium text-text-primary">
              Adicionar
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="rounded-md p-2 text-text-secondary hover:text-text-primary focus-visible:outline-none"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {ADD_SHEET_ITEMS.map((item) => {
              const Icon = item.icon;
              const href = resolveNavItem(item, vehicleId);
              if (!href) return null;

              return (
                <Link
                  key={item.label}
                  to={href}
                  onClick={() => onOpenChange(false)}
                  className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-md border border-border p-3 text-center text-text-primary transition-colors duration-150 hover:border-accent"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
