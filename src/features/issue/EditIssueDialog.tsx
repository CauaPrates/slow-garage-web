import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentField } from "@/features/attachment/AttachmentField";
import {
  FORM_DIALOG_HEADER_CLASSNAME,
  focusDialogOnOpen,
} from "@/components/ui/form";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateOnly } from "@/lib/format";
import { translatePostgresError } from "@/lib/postgresErrors";
import { ISSUE_FORM_DIALOG_CLASSNAME } from "./CreateIssueDialog";
import { IssueForm } from "./IssueForm";
import { useUpdateIssue } from "./useIssues";
import { ISSUE_STATUS_LABELS, type IssueFormInput, type IssueFormOutput } from "./schemas";
import type { IssueRow } from "./useIssues";

type EditIssueDialogProps = {
  vehicleId: string;
  issue: IssueRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Depois de salvar: o status gravado (a página decide pra onde o foco vai se a linha trocou de grupo). */
  onSaved?: (status: IssueFormOutput["status"]) => void;
};

function toFormDefaults(issue: IssueRow): Partial<IssueFormInput> {
  return {
    title: issue.title,
    reportedOn: issue.reported_on,
    priority: issue.priority,
    status: issue.status,
    description: issue.description ?? undefined,
    diagnosis: issue.diagnosis ?? undefined,
    resolution: issue.resolution ?? undefined,
    resolvedOn: issue.resolved_on ?? undefined,
    odometerKm: issue.odometer_km != null ? String(issue.odometer_km) : undefined,
    cost: issue.cost != null ? String(issue.cost) : undefined,
  };
}

/**
 * Etapa 08: "Editar problema" com qual registro está aberto na descrição e o
 * anexo no fim do corpo (`AttachmentField`, o fluxo da etapa 05). A página
 * guarda o problema aberto — a linha pode trocar de grupo (abertos ↔
 * resolvidos) e desmontar quando a lista recarrega. Os valores iniciais só
 * entram na montagem: o refetch atualiza o anexo, não o que está digitado.
 */
export function EditIssueDialog({ vehicleId, issue, open, onOpenChange, onSaved }: EditIssueDialogProps) {
  const updateIssue = useUpdateIssue(vehicleId);
  const [error, setError] = useState<string | null>(null);
  const returnFocus = useReturnFocus();

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleSubmit(values: IssueFormOutput) {
    setError(null);
    try {
      await updateIssue.mutateAsync({
        id: issue.id,
        title: values.title,
        reported_on: values.reportedOn,
        priority: values.priority,
        status: values.status,
        description: values.description ?? null,
        diagnosis: values.diagnosis ?? null,
        resolution: values.resolution ?? null,
        resolved_on: values.resolvedOn ?? null,
        odometer_km: values.odometerKm ?? null,
        cost: values.cost ?? null,
      });
      onSaved?.(values.status);
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  const identity = [issue.title, ISSUE_STATUS_LABELS[issue.status], `relatado em ${formatDateOnly(issue.reported_on)}`].join(" · ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={ISSUE_FORM_DIALOG_CLASSNAME}
        onOpenAutoFocus={(event) => {
          returnFocus.capture();
          focusDialogOnOpen(event);
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogHeader className={FORM_DIALOG_HEADER_CLASSNAME}>
          <DialogTitle>Editar problema</DialogTitle>
          <DialogDescription className="break-words">{identity}</DialogDescription>
        </DialogHeader>
        <IssueForm
          mode="edit"
          defaultValues={toFormDefaults(issue)}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          submitError={error}
          attachment={
            <AttachmentField
              vehicleId={vehicleId}
              entityType="issue"
              entityId={issue.id}
              attachment={issue.attachment}
            />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
