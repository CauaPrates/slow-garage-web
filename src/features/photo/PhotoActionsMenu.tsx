import { useRef, useState } from "react";
import { MoreHorizontal, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuSeparator, ROW_ACTIONS_TRIGGER_CLASSNAME, menuItemClassName } from "@/components/ui/menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { photoActionsId, photoLabelId } from "./photoPresentation";

type PhotoActionsMenuProps = {
  photoId: string;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onDelete: (trigger: HTMLElement | null) => void;
};

/**
 * Etapa 12: o "⋯" de cada foto, com as peças do menu comum (gatilho de 44px,
 * item de 44px, divisor, excluir em carmim por último). O `RowActionsMenu`
 * não serve aqui: a foto não tem "Editar" — tem "Definir como capa", que só
 * aparece nas fotos que ainda não são a capa. O botão é descrito pela
 * identificação da foto ("Foto 3 de 12: Volante novo").
 */
export function PhotoActionsMenu({ photoId, isPrimary, onSetPrimary, onDelete }: PhotoActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          id={photoActionsId(photoId)}
          variant="ghost"
          size="icon"
          aria-label="Ações da foto"
          aria-describedby={photoLabelId(photoId)}
          className={ROW_ACTIONS_TRIGGER_CLASSNAME}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-max min-w-56 p-1.5" align="end" aria-label="Ações da foto">
        {!isPrimary && (
          <>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSetPrimary();
              }}
              className={menuItemClassName()}
            >
              <Star className="h-4 w-4 text-text-secondary" aria-hidden="true" />
              Definir como capa
            </button>
            <MenuSeparator />
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDelete(triggerRef.current);
          }}
          className={menuItemClassName("destructive")}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Excluir foto
        </button>
      </PopoverContent>
    </Popover>
  );
}
