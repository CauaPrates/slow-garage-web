import { useId, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RowActionsMenu } from "@/components/ui/menu";
import { textLinkClassName } from "@/components/ui/text-link";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OBLIGATION_KIND_LABELS } from "./schemas";
import type { ObligationRow } from "./useObligations";
import type { RecordStatus } from "./documentPresentation";

/** Colunas a partir de `md`: obrigação (e detalhes) · situação e data · valor · "⋯". */
export const OBLIGATION_ROW_GRID =
  "md:grid-cols-[minmax(0,1fr)_11rem_9rem_2.75rem] md:grid-rows-[auto_1fr] md:gap-x-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] 2xl:gap-x-6";

type ObligationListItemProps = {
  obligation: ObligationRow;
  status: RecordStatus | null;
  dateLabel: string;
  onMarkPaid: (obligation: ObligationRow, trigger: HTMLElement | null) => void;
  onEdit: (obligation: ObligationRow, trigger: HTMLElement | null) => void;
  onDelete: (obligation: ObligationRow, trigger: HTMLElement | null) => void;
};

/**
 * Etapa 11: uma obrigação. O vencimento e a situação vêm em destaque (selo +
 * data); valor ausente é escrito ("Valor não informado"), nunca vira R$ 0,00.
 * Pendente ganha "Marcar como paga" à vista — é a única forma de silenciar o
 * alerta (RN-3); editar e excluir ficam no "⋯". Paga mostra a data do
 * pagamento e, embaixo, o vencimento que tinha.
 */
export function ObligationListItem({ obligation, status, dateLabel, onMarkPaid, onEdit, onDelete }: ObligationListItemProps) {
  const identityId = useId();
  const markPaidRef = useRef<HTMLButtonElement>(null);
  const isPaid = obligation.paid_on != null;
  const amount = obligation.amount != null ? formatMoney(obligation.amount) : null;
  const details = [OBLIGATION_KIND_LABELS[obligation.kind], obligation.provider].filter(Boolean);
  const notes = obligation.notes?.trim() ? obligation.notes : null;
  const dateIso = isPaid ? obligation.paid_on : obligation.due_on;

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-x-2 gap-y-1.5 px-(--panel-pad-x) py-3",
        OBLIGATION_ROW_GRID,
      )}
    >
      <span id={identityId} className="sr-only">
        {obligation.label}, {dateLabel}
        {amount ? `, ${amount}` : ""}
      </span>

      <p className="type-item-title pt-0.5 break-words text-text-primary md:col-start-1 md:row-start-1 md:pt-px">
        {obligation.label}
      </p>

      <div className="-my-2.5 flex justify-end md:col-start-4 md:row-span-2 md:row-start-1">
        <RowActionsMenu
          label="Ações da obrigação"
          editLabel="Editar obrigação"
          deleteLabel="Excluir obrigação"
          describedBy={identityId}
          onEdit={(trigger) => onEdit(obligation, trigger)}
          onDelete={(trigger) => onDelete(obligation, trigger)}
        />
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1 md:col-span-1 md:col-start-2 md:row-span-2 md:row-start-1 md:flex-col md:items-start md:pt-px">
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
        <p className={cn("text-sm tabular-nums", dateIso ? "text-text-primary" : "text-text-secondary")}>
          {/* "Vence hoje" já está no selo: aqui fica a data. */}
          {dateIso ? <time dateTime={dateIso}>{status?.label === dateLabel ? formatDateOnly(dateIso) : dateLabel}</time> : dateLabel}
        </p>
        {!isPaid && (
          // Ação em texto (alvo de 44px, margem negativa): à vista em cada pendente sem pesar a linha como um botão cheio.
          <button
            ref={markPaidRef}
            type="button"
            aria-describedby={identityId}
            onClick={() => onMarkPaid(obligation, markPaidRef.current)}
            className={cn(textLinkClassName(), "-my-2 -ml-1 basis-full md:basis-auto")}
          >
            <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
            Marcar como paga
          </button>
        )}
        {isPaid && obligation.due_on && (
          <p className="text-xs text-text-secondary tabular-nums md:-mt-0.5">
            Vencimento {formatDateOnly(obligation.due_on)}
          </p>
        )}
      </div>

      <p
        className={cn(
          "col-span-2 md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1 md:pt-px md:text-right",
          amount ? "type-value whitespace-nowrap text-text-primary" : "text-sm text-text-secondary",
        )}
      >
        {amount ?? "Valor não informado"}
      </p>

      <div className="col-span-2 flex min-w-0 flex-col items-start gap-1 md:col-span-1 md:col-start-1 md:row-start-2">
        <p className="text-xs break-words text-text-secondary">{details.join(" · ")}</p>
        {notes && (
          <p className="max-w-prose text-xs break-words whitespace-pre-line text-text-secondary">
            <span className="sr-only">Notas: </span>
            {notes}
          </p>
        )}
      </div>
    </li>
  );
}
