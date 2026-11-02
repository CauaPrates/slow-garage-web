import { useId, useRef, useState } from "react";
import { ChevronDown, MoreHorizontal, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const MENU_ITEM_CLASSNAME =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors duration-(--duration-fast)";

const BADGE_CLASSNAME = "inline-flex shrink-0 items-center rounded-full border px-2 text-xs leading-5 font-medium whitespace-nowrap";

function Detail({ label, value, wide = false }: { label: string; value: string | null; wide?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", wide && "sm:col-span-2")}>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className={cn("break-words whitespace-pre-line", value ? "text-text-primary" : "text-text-secondary")}>
        {value ?? "Não informado"}
      </dd>
    </div>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  const badge = <span className={cn(BADGE_CLASSNAME, status.className)}>{status.label}</span>;

  return (
    <li className={cn("flex flex-col gap-2 px-4 py-3", ISSUE_ROW_GRID)}>
      {/* Lido como contexto dos botões da linha: qual problema eles afetam. */}
      <span id={identityId} className="sr-only">
        {issue.title}, {status.label}, {reported}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 text-sm font-medium break-words text-text-primary">{issue.title}</span>
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

      <p className="hidden text-right font-mono text-sm tabular-nums lg:block">
        {cost ? (
          <span className="text-text-primary">{cost}</span>
        ) : (
          <span className="text-text-secondary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Sem custo informado</span>
          </span>
        )}
      </p>

      {/* No celular, margens negativas: os alvos de 44px não somam um vão em branco embaixo da linha. */}
      <div className="-mx-2 -mt-1 -mb-2 flex items-center gap-1 lg:mx-0 lg:-my-1 lg:justify-end">
        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          aria-describedby={identityId}
          onClick={() => setDetailsOpen((open) => !open)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary"
        >
          Detalhes
          <ChevronDown
            className={cn(
              "h-4 w-4 motion-safe:transition-transform motion-safe:duration-(--duration-base)",
              detailsOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        <span className="flex-1 lg:hidden" aria-hidden="true" />
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="ghost"
              size="icon"
              aria-label="Ações do problema"
              aria-describedby={identityId}
              className="shrink-0 text-text-secondary hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1.5" align="end" aria-label="Ações do problema">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(issue, triggerRef.current);
              }}
              className={`${MENU_ITEM_CLASSNAME} text-text-primary hover:bg-state-hover`}
            >
              <Pencil className="h-4 w-4 text-text-secondary" aria-hidden="true" />
              Editar problema
            </button>
            <div className="my-1.5 h-px bg-border" aria-hidden="true" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete(issue, triggerRef.current);
              }}
              className={`${MENU_ITEM_CLASSNAME} text-error hover:bg-error/10`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Excluir problema
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Fechado: `hidden` (continua montado). Conteúdo inteiro, sem corte. */}
      <dl
        id={detailsId}
        hidden={!detailsOpen}
        className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-md border border-border bg-bg px-3 py-2.5 text-sm sm:grid-cols-2 lg:col-span-4"
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
