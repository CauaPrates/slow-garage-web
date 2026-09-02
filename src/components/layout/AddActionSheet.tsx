import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ADD_SHEET_ITEMS } from "@/lib/navigation";

type AddActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Folha do botão "Adicionar" — usa o Dialog (Radix) já instalado, só com
 * posicionamento próprio na base da tela, em vez de instalar uma lib de
 * bottom-sheet (ver plan.md, alternativas descartadas). Todos os itens
 * estão desabilitados nesta fase: nenhum fluxo de registro existe até a
 * Fase 4 (RN-2 de specs/003-vehicle-shell/spec.md).
 */
export function AddActionSheet({ open, onOpenChange }: AddActionSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <DialogPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-lg border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg transition-all duration-150 focus:outline-none data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100"
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
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-disabled="true"
                  onClick={(event) => event.preventDefault()}
                  className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-md border border-border p-3 text-center opacity-50 cursor-not-allowed"
                >
                  <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                  <span className="text-xs text-text-primary">{item.label}</span>
                  <span className="text-[10px] text-text-secondary">Em breve</span>
                </button>
              );
            })}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
