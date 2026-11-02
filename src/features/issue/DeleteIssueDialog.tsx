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
import { formatDateOnly, formatKm } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { isOpenIssue, issueCostLabel } from "./issuePresentation";
import { ISSUE_STATUS_LABELS } from "./schemas";
import { useDeleteIssue } from "./useIssues";
import type { IssueRow } from "./useIssues";

type DeleteIssueDialogProps = {
  vehicleId: string;
  issue: IssueRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois da exclusão confirmada pelo servidor — quem chama cuida do foco quando a linha some. */
  onDeleted?: () => void;
};

/**
 * Etapa 08: o título não depende mais do texto do problema (antes
 * `Excluir "{título}"?`); o registro aparece num cartão neutro. Consequências
 * conferidas nas migrations e no hook: o anexo sai antes
 * (`deleteAttachmentIfExists`); o problema sai do histórico do veículo
 * (`vehicle_timeline`) e da busca; aberto, sai da contagem de abertos do
 * dashboard (`open_issues_count`). O custo informado nunca entrou nos totais
 * (DATABASE.md, RN-1 da Fase 8), então nenhum total muda.
 */
export function DeleteIssueDialog({ vehicleId, issue, open, onOpenChange, onDeleted }: DeleteIssueDialogProps) {
  const deleteIssue = useDeleteIssue(vehicleId);
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
      await deleteIssue.mutateAsync(issue.id);
      onDeleted?.();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    } finally {
      deletingRef.current = false;
    }
  }

  const effects = [
    "Sai da lista e do histórico do veículo.",
    isOpenIssue(issue.status) ? "Deixa de contar nos problemas abertos do painel." : null,
    issue.attachment ? "O anexo também é apagado." : null,
    "Essa ação não pode ser desfeita.",
  ]
    .filter(Boolean)
    .join(" ");

  const meta = [
    ISSUE_STATUS_LABELS[issue.status],
    `relatado em ${formatDateOnly(issue.reported_on)}`,
    issue.odometer_km != null ? formatKm(issue.odometer_km) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const cost = issueCostLabel(issue.cost);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onOpenAutoFocus={returnFocus.capture} onCloseAutoFocus={returnFocus.onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir problema?</AlertDialogTitle>
          <AlertDialogDescription>{effects}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm font-medium break-words text-text-primary">{issue.title}</p>
            <p className="text-xs break-words text-text-secondary">{meta}</p>
            {issue.attachment && (
              <p className="text-xs break-all text-text-secondary">Anexo: {issue.attachment.original_filename}</p>
            )}
          </div>
          <p className="shrink-0 font-mono text-sm text-text-primary">
            {/* Ausente não é zero: zero salvo mostra R$ 0,00. */}
            {cost ?? <span className="font-sans text-text-secondary">Custo não informado</span>}
          </p>
        </div>
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteIssue.isPending}>
            {deleteIssue.isPending ? "Excluindo…" : "Excluir problema"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
