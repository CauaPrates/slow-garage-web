import { useRef, useState, type MouseEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/ui/field-error";
import { PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateOnly } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { moneyOrNull } from "./projectPresentation";
import { PROJECT_ITEM_STATUS_LABELS } from "./schemas";
import { useDeleteProjectItem } from "./useProjectItems";
import type { ProjectItemRow } from "./useProjectItems";

type DeleteProjectItemDialogProps = {
  item: ProjectItemRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois da exclusão confirmada pelo servidor — quem chama cuida do foco quando a linha some. */
  onDeleted?: () => void;
};

function CostLine({ label, value }: { label: string; value: number | null }) {
  const money = moneyOrNull(value);
  return (
    <p className="text-sm">
      <span className="text-xs text-text-secondary">{label} </span>
      {/* Ausente não é zero: zero salvo mostra R$ 0,00. */}
      {money ? (
        <span className="font-mono text-text-primary">{money}</span>
      ) : (
        <span className="text-text-secondary">Custo não informado</span>
      )}
    </p>
  );
}

/**
 * Etapa 09: título fixo (antes `Excluir "{nome}"?`) e o item num cartão
 * neutro. Consequências conferidas: não cancelado, sai do progresso
 * (`project_progress`); com data, sai da `vehicle_timeline`; instalado com
 * custo real, sai dos totais do veículo; o anexo é apagado antes da linha
 * (`deleteAttachmentIfExists` no hook — ordem preexistente, pendência no
 * ADR-092).
 */
export function DeleteProjectItemDialog({ item, open, onOpenChange, onDeleted }: DeleteProjectItemDialogProps) {
  const deleteItem = useDeleteProjectItem();
  const [error, setError] = useState<string | null>(null);
  const deletingRef = useRef(false);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    if (deletingRef.current) return;
    deletingRef.current = true;
    setError(null);
    try {
      await deleteItem.mutateAsync({ id: item.id, projectId: item.project_id });
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  const effects = [
    item.status !== "cancelled" ? "Sai do projeto e da conta do progresso." : "Sai do projeto.",
    item.occurred_on ? "Sai do histórico do veículo." : null,
    item.status === "installed" && item.actual_cost != null ? "O custo real deixa de contar nos totais do veículo." : null,
    item.attachment ? "O anexo também é apagado." : null,
    "Essa ação não pode ser desfeita.",
  ]
    .filter(Boolean)
    .join(" ");

  const meta = [
    PROJECT_ITEM_STATUS_LABELS[item.status],
    `prioridade ${PRIORITY_LEVEL_LABELS[item.priority].toLowerCase()}`,
    item.vendor,
    item.occurred_on ? formatDateOnly(item.occurred_on) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir item?</AlertDialogTitle>
          <AlertDialogDescription>{effects}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 rounded-md border border-border bg-bg px-3 py-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm font-medium break-words text-text-primary">{item.name}</p>
            <p className="text-xs break-words text-text-secondary">{meta}</p>
            {item.attachment && (
              <p className="text-xs break-all text-text-secondary">Anexo: {item.attachment.original_filename}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <CostLine label="Estimado" value={item.estimated_cost} />
            <CostLine label="Real" value={item.actual_cost} />
          </div>
        </div>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteItem.isPending}>
            {deleteItem.isPending ? "Excluindo…" : "Excluir item"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
