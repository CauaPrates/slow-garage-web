import { useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditVehicleDialog } from "./EditVehicleDialog";
import { DeleteVehicleDialog } from "./DeleteVehicleDialog";
import type { VehicleWithSummary } from "./useVehicles";
import { MenuSeparator, menuItemClassName } from "@/components/ui/menu";

type VehicleCardMenuProps = {
  vehicle: VehicleWithSummary;
  /** `id` do título do card — dá o contexto do veículo ao botão e ao menu. */
  vehicleNameId: string;
  /** Recalibração 01: no card da garagem o gatilho fica sobre a foto, com fundo sólido. */
  triggerClassName?: string;
};

/**
 * Redesign etapa 02: editar e excluir saem da faixa de registros do card —
 * são ações raras e uma delas é destrutiva, não devem ficar lado a lado com
 * "Registrar gasto". Mesma forma do `HeaderUserMenu` (popover com itens de
 * 44px e a ação de risco separada por divisor, em carmim). Os diálogos são
 * os de sempre, sem mudança de campo nem de regra.
 *
 * O item que abriu o diálogo some junto com o popover, então ao fechar o
 * diálogo o foco volta explicitamente pro gatilho "Mais ações" — sem isso
 * caía no `<body>` (mesma correção do "Sair" no `HeaderUserMenu`).
 */
export function VehicleCardMenu({ vehicle, vehicleNameId, triggerClassName }: VehicleCardMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function focusTrigger() {
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  /**
   * Etapa 03: depois da exclusão o foco volta pro ⋯ como sempre, mas o card
   * inteiro some quando a lista recarrega — e o foco cairia no `<body>`. Este
   * acompanhamento sobrevive ao card: quando o gatilho sai do DOM e ninguém
   * moveu o foco, ele vai pro título da lista ("Seus veículos (N)", que já diz
   * a contagem nova) ou, sem veículo nenhum, pro título da página.
   */
  function focusAfterRemoval() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const startedAt = performance.now();
    const check = () => {
      if (trigger.isConnected) {
        // Recarregar a lista pode falhar ou demorar; depois de 10s, desiste.
        if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
        return;
      }
      if (document.activeElement && document.activeElement !== document.body) return;
      const target =
        document.getElementById("garage-vehicles-title") ??
        document.querySelector<HTMLElement>("main h1");
      if (!target) return;
      target.tabIndex = -1;
      target.focus();
    };
    requestAnimationFrame(check);
  }

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            aria-label="Mais ações"
            aria-describedby={vehicleNameId}
            data-tip="Mais ações"
            data-tip-side="bottom"
            className={cn(
              "text-text-secondary hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary",
              triggerClassName,
            )}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1.5" align="end" aria-labelledby={vehicleNameId}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setEditOpen(true);
            }}
            className={menuItemClassName()}
          >
            <Pencil className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            Editar veículo
          </button>
          <MenuSeparator />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
            className={menuItemClassName("destructive")}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir veículo
          </button>
        </PopoverContent>
      </Popover>

      <EditVehicleDialog
        vehicle={vehicle}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) focusTrigger();
        }}
      />
      <DeleteVehicleDialog
        vehicle={vehicle}
        open={deleteOpen}
        onDeleted={focusAfterRemoval}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) focusTrigger();
        }}
      />
    </>
  );
}
