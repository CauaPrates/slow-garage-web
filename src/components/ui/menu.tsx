import { useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Harmonização 01: item de menu em popover (menu do usuário, "⋯" do card do
 * veículo, "⋯" das linhas). Alvo de 44px, ícone à esquerda; o tom diz se a
 * ação é comum ou destrutiva (carmim, depois do divisor).
 */
export function menuItemClassName(tone: "default" | "destructive" = "default") {
  return cn(
    "flex min-h-control w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors duration-(--duration-fast)",
    tone === "destructive" ? "text-error hover:bg-error/10" : "text-text-primary hover:bg-state-hover",
  );
}

/** Divisor entre as ações comuns e a destrutiva. */
export function MenuSeparator() {
  return <div className="my-1.5 h-px bg-border" aria-hidden="true" />;
}

/** Botão "⋯" de linha/card: 44px, neutro, marcado enquanto o menu está aberto. */
export const ROW_ACTIONS_TRIGGER_CLASSNAME =
  "shrink-0 text-text-secondary hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary";

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
 * O "⋯" das linhas de registro (Gastos, Abastecimentos, Manutenção,
 * Problemas, Projetos, Modificações): editar em cima e, depois do divisor e
 * em carmim, excluir. Devolve o próprio botão a quem abre o diálogo, pra o
 * foco voltar a ele. A largura acompanha o rótulo mais longo
 * ("Excluir item do plano") sem quebrar.
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
          className={ROW_ACTIONS_TRIGGER_CLASSNAME}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-max min-w-56 p-1.5" align="end" aria-label={label}>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onEdit(triggerRef.current);
          }}
          className={menuItemClassName()}
        >
          <Pencil className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          {editLabel}
        </button>
        <MenuSeparator />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDelete(triggerRef.current);
          }}
          className={menuItemClassName("destructive")}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {deleteLabel}
        </button>
      </PopoverContent>
    </Popover>
  );
}
