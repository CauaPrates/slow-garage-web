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
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateOnly } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { isActiveProject, moneyOrNull, progressLabel, projectDateParts, readProgress } from "./projectPresentation";
import { PROJECT_STATUS_LABELS } from "./schemas";
import { useDeleteProject } from "./useProjects";
import type { ProjectWithProgress } from "./useProjects";

type DeleteProjectDialogProps = {
  vehicleId: string;
  project: ProjectWithProgress;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois da exclusão confirmada pelo servidor — quem chama cuida do foco quando a linha some. */
  onDeleted?: () => void;
};

/**
 * Etapa 09: título fixo (antes `Excluir "{nome}"?`) e o registro num cartão
 * neutro. Consequências conferidas nas migrations: `project_items.project_id`
 * é `on delete cascade` (ADR-033), então os itens vão junto; com eles saem os
 * eventos de item com data da `vehicle_timeline` e o custo real dos
 * instalados de `vehicle_financial_summary`/gastos por mês. Ativo (ideia,
 * planejado, em andamento, pausado), sai do `active_projects_count`.
 *
 * O texto não fala dos anexos dos itens: `attachments` é polimórfica, sem FK
 * nem trigger, e o hook não os apaga — prometer limpeza seria falso (pendência
 * no ADR-092).
 */
export function DeleteProjectDialog({ vehicleId, project, open, onOpenChange, onDeleted }: DeleteProjectDialogProps) {
  const deleteProject = useDeleteProject(vehicleId);
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
      await deleteProject.mutateAsync(project.id);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  const effects = [
    "Todos os itens do projeto também são excluídos.",
    "Itens com data saem do histórico do veículo, e o custo real dos instalados sai dos totais.",
    isActiveProject(project.status) ? "Deixa de contar nos projetos ativos do painel." : null,
    "Essa ação não pode ser desfeita.",
  ]
    .filter(Boolean)
    .join(" ");

  const state = readProgress(project.progress);
  const meta = [PROJECT_STATUS_LABELS[project.status], ...projectDateParts(project, formatDateOnly)].join(" · ");
  const budget = moneyOrNull(project.budget);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
          <AlertDialogDescription>{effects}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm font-medium break-words text-text-primary">{project.name}</p>
            <p className="text-xs break-words text-text-secondary">{meta}</p>
            <p className="text-xs text-text-secondary">
              {state.kind === "ready" ? progressLabel(state) : "Sem itens a medir"}
            </p>
          </div>
          <p className="shrink-0 text-right text-sm">
            <span className="block text-xs text-text-secondary">Orçamento</span>
            {budget ? (
              <span className="font-mono text-text-primary">{budget}</span>
            ) : (
              <span className="text-text-secondary">Não definido</span>
            )}
          </p>
        </div>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteProject.isPending}>
            {deleteProject.isPending ? "Excluindo…" : "Excluir projeto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
