import { useId, useState } from "react";
import { Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DetailItem as Detail, DisclosureButton, INSET_CLASSNAME } from "@/components/ui/disclosure";
import { RowActionsMenu } from "@/components/ui/menu";
import { PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import { formatDateOnly, formatKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ISSUE_STATUS_PRESENTATION, issueCostLabel } from "./issuePresentation";
import type { IssueRow } from "./useIssues";

type IssueListRowProps = {
  issue: IssueRow;
  onEdit: (issue: IssueRow, trigger: HTMLElement | null) => void;
  onDelete: (issue: IssueRow, trigger: HTMLElement | null) => void;
};

/**
 * Colunas a partir de `lg`: problema (título, relato, km, prioridade) ·
 * situação · custo informado · ações. A coluna das ações tem largura fixa
 * ("Detalhes" e "⋯"), então o cabeçalho — sem botões — alinha com as linhas.
 */
export const ISSUE_ROW_GRID = "lg:grid lg:grid-cols-[minmax(0,1fr)_9rem_7.5rem_9.5rem] lg:items-start lg:gap-x-4";


/**
 * Etapa 08: um problema. Título, a situação em selo (texto + cor; "Aberto"
 * em âmbar, em andamento neutro, "Resolvido" verde, "Descartado" tracejado) e
 * a linha de relato — data, km e prioridade em texto neutro, que é escolha de
 * quem relatou e não situação. O custo informado fica numa coluna própria
 * no desktop e na linha de relato no celular; ausente é "—", zero é R$ 0,00.
 *
 * "Detalhes" (`aria-expanded`) mostra o conteúdo inteiro: descrição,
 * diagnóstico, resolução, data de resolução e anexo. Editar e excluir moram
 * no "⋯"; a linha não é clicável. Os diálogos ficam na página (a linha troca
 * de grupo quando o status muda).
 */
export function IssueListRow({ issue, onEdit, onDelete }: IssueListRowProps) {
  const identityId = useId();
  const detailsId = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const status = ISSUE_STATUS_PRESENTATION[issue.status];
  const cost = issueCostLabel(issue.cost);
  const reported = `Relatado em ${formatDateOnly(issue.reported_on)}`;
  const meta = [
    reported,
    issue.odometer_km != null ? formatKm(issue.odometer_km) : null,
    `Prioridade ${PRIORITY_LEVEL_LABELS[issue.priority].toLowerCase()}`,
    issue.resolved_on ? `resolvido em ${formatDateOnly(issue.resolved_on)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const badge = <Badge tone={status.tone}>{status.label}</Badge>;

  return (
    <li className={cn("flex flex-col gap-2 px-(--panel-pad-x) py-3", ISSUE_ROW_GRID)}>
      {/* Lido como contexto dos botões da linha: qual problema eles afetam. */}
      <span id={identityId} className="sr-only">
        {issue.title}, {status.label}, {reported}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="type-item-title min-w-0 text-text-primary">{issue.title}</span>
          <span className="lg:hidden">{badge}</span>
        </p>
        <p className="text-xs break-words text-text-secondary tabular-nums">
          {meta}
          {/* No celular o custo entra aqui; no desktop tem coluna. */}
          <span className="lg:hidden"> · {cost ? `custo informado ${cost}` : "sem custo informado"}</span>
        </p>
        {issue.attachment && (
          <p className="inline-flex items-center gap-1 text-xs text-text-primary">
            <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
            Anexo
          </p>
        )}
      </div>

      <div className="hidden lg:block lg:pt-px">{badge}</div>

      <p className="hidden text-right text-sm lg:block">
        {cost ? (
          <span className="type-value text-sm text-text-primary">{cost}</span>
        ) : (
          <span className="text-text-secondary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Sem custo informado</span>
          </span>
        )}
      </p>

      {/* No celular, margens negativas: os alvos de 44px não somam um vão em branco embaixo da linha. */}
      <div className="-mx-2 -mt-1 -mb-2 flex items-center gap-1 lg:mx-0 lg:-my-1 lg:justify-end">
        <DisclosureButton
          open={detailsOpen}
          controls={detailsId}
          describedBy={identityId}
          onToggle={() => setDetailsOpen((open) => !open)}
        >
          Detalhes
        </DisclosureButton>
        <span className="flex-1 lg:hidden" aria-hidden="true" />
        <RowActionsMenu
          label="Ações do problema"
          editLabel="Editar problema"
          deleteLabel="Excluir problema"
          describedBy={identityId}
          onEdit={(trigger) => onEdit(issue, trigger)}
          onDelete={(trigger) => onDelete(issue, trigger)}
        />
      </div>

      {/* Fechado: `hidden` (continua montado). Conteúdo inteiro, sem corte. */}
      <dl
        id={detailsId}
        hidden={!detailsOpen}
        className={cn("grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:col-span-4", INSET_CLASSNAME)}
      >
        <Detail label="Descrição" value={issue.description} wide />
        <Detail label="Diagnóstico" value={issue.diagnosis} wide />
        <Detail label="Resolução" value={issue.resolution} wide />
        <Detail label="Data de resolução" value={issue.resolved_on ? formatDateOnly(issue.resolved_on) : null} />
        <Detail label="Quilometragem" value={issue.odometer_km != null ? formatKm(issue.odometer_km) : null} />
        <Detail
          label="Custo informado"
          value={cost ? `${cost} — não entra nos totais do veículo` : null}
        />
        <Detail label="Anexo" value={issue.attachment?.original_filename ?? null} />
      </dl>
    </li>
  );
}
