import { useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MENU_ITEM_CLASSNAME =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors duration-(--duration-fast)";

type RowActionsMenuProps = {
  /** Nome do botão e do menu, ex.: "Ações do projeto". */
  label: string;
  editLabel: string;
  deleteLabel: string;
  /** Id do texto que diz qual registro o botão afeta. */
  describedBy: string;
  onEdit: (trigger: HTMLElement | null) => void;
  onDelete: (trigger: HTMLElement | null) => void;
};

/**
 * Etapa 09: o "⋯" das linhas, na mesma forma de Gastos/Manutenção/Problemas —
 * editar em cima e, depois do divisor e em carmim, excluir. Devolve o próprio
 * botão a quem abre o diálogo, pra o foco voltar a ele.
 */
export function RowActionsMenu({ label, editLabel, deleteLabel, describedBy, onEdit, onDelete }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-describedby={describedBy}
          className="shrink-0 text-text-secondary hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1.5" align="end" aria-label={label}>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onEdit(triggerRef.current);
          }}
          className={`${MENU_ITEM_CLASSNAME} text-text-primary hover:bg-state-hover`}
        >
          <Pencil className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          {editLabel}
        </button>
        <div className="my-1.5 h-px bg-border" aria-hidden="true" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDelete(triggerRef.current);
          }}
          className={`${MENU_ITEM_CLASSNAME} text-error hover:bg-error/10`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {deleteLabel}
        </button>
      </PopoverContent>
    </Popover>
  );
}
