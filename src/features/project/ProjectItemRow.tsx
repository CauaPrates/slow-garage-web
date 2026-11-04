import { useId, useState } from "react";
import { ChevronDown, ExternalLink, Paperclip } from "lucide-react";
import { PRIORITY_LEVEL_LABELS } from "@/features/maintenance/schemas";
import { formatDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PROJECT_ITEM_STATUS_PRESENTATION, STATUS_BADGE_CLASSNAME, moneyOrNull } from "./projectPresentation";
import { RowActionsMenu } from "./RowActionsMenu";
import type { ProjectItemRow as ProjectItem } from "./useProjectItems";

/**
 * Colunas a partir de `xl`: item (nome, prioridade, fornecedor, data, anexo,
 * link) · situação · estimado · real · ações. A coluna das ações tem largura
 * fixa ("Detalhes" e "⋯"), então o cabeçalho — sem botões — alinha com as
 * linhas. Abaixo de `xl` empilha: em 1024–1279px, com a barra lateral, o nome
 * ficaria com ~120px.
 */
export const PROJECT_ITEM_ROW_GRID =
  "xl:grid xl:grid-cols-[minmax(0,1fr)_9rem_7.5rem_7.5rem_9.5rem] xl:items-start xl:gap-x-4";

/** Só endereço web vira link clicável; outro texto salvo no campo aparece em Detalhes, sem `href`. */
export function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

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

/** Valor em coluna: ausente é "—" (lido como "não informado"), zero é R$ 0,00. */
function MoneyCell({ value, srLabel }: { value: string | null; srLabel: string }) {
  return (
    <p className="hidden text-right font-mono text-sm tabular-nums xl:block">
      {value ? (
        <span className="text-text-primary">
          <span className="sr-only">{srLabel} </span>
          {value}
        </span>
      ) : (
        <span className="text-text-secondary">
          <span aria-hidden="true">—</span>
          <span className="sr-only">{srLabel} não informado</span>
        </span>
      )}
    </p>
  );
}

type ProjectItemRowProps = {
  item: ProjectItem;
  onEdit: (item: ProjectItem, trigger: HTMLElement | null) => void;
  onDelete: (item: ProjectItem, trigger: HTMLElement | null) => void;
};

/**
 * Etapa 09: um item do projeto. Situação em selo (desejado e planejado
 * neutros, comprado no acento, instalado verde, cancelado tracejado);
 * prioridade em texto neutro — é escolha de quem planeja, não situação.
 * Estimado e real sempre rotulados e nunca somados num número só; ausente
 * "não informado", zero R$ 0,00.
 *
 * O link externo é um `<a>` próprio, com 44px de alvo e "abre em nova aba",
 * fora de qualquer outro controle. "Detalhes" (`aria-expanded`) mostra
 * descrição, notas e o restante por inteiro. Editar e excluir no "⋯"; a linha
 * não é clicável. Os diálogos ficam na página.
 */
export function ProjectItemRow({ item, onEdit, onDelete }: ProjectItemRowProps) {
  const identityId = useId();
  const detailsId = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const status = PROJECT_ITEM_STATUS_PRESENTATION[item.status];
  const estimated = moneyOrNull(item.estimated_cost);
  const actual = moneyOrNull(item.actual_cost);
  const link = safeExternalUrl(item.external_url);
  const meta = [
    `Prioridade ${PRIORITY_LEVEL_LABELS[item.priority].toLowerCase()}`,
    item.vendor,
    item.occurred_on ? `Data ${formatDateOnly(item.occurred_on)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const badge = <span className={cn(STATUS_BADGE_CLASSNAME, status.className)}>{status.label}</span>;
  const actualNote =
    actual == null
      ? null
      : item.status === "installed"
        ? `${actual} — entra nos totais do veículo`
        : `${actual} — fica só no projeto enquanto o item não estiver Instalado`;

  return (
    <li className={cn("flex flex-col gap-2 px-4 py-3", PROJECT_ITEM_ROW_GRID)}>
      <span id={identityId} className="sr-only">
        {item.name}, {status.label}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 text-sm font-medium break-words text-text-primary">{item.name}</span>
          <span className="xl:hidden">{badge}</span>
        </p>
        <p className="text-xs break-words text-text-secondary tabular-nums">{meta}</p>
        {/* Abaixo de xl os dois valores entram aqui, cada um com o próprio rótulo. */}
        <p className="text-xs text-text-secondary xl:hidden">
          Estimado{" "}
          {estimated ? <span className="font-mono text-text-primary tabular-nums">{estimated}</span> : "não informado"}
          {" · "}Real{" "}
          {actual ? <span className="font-mono text-text-primary tabular-nums">{actual}</span> : "não informado"}
        </p>
        {(item.attachment || link) && (
          <div className={cn("flex flex-wrap items-center gap-x-4", link && "-my-1")}>
            {item.attachment && (
              <p className={cn("inline-flex items-center gap-1 text-xs text-text-primary", link && "min-h-11")}>
                <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                Anexo
              </p>
            )}
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby={identityId}
                className="-mx-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-xs text-text-primary underline decoration-border-strong underline-offset-2 transition-colors duration-(--duration-fast) hover:decoration-text-primary"
              >
                Link externo
                <ExternalLink className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            )}
          </div>
        )}
      </div>

      <div className="hidden xl:block xl:pt-px">{badge}</div>
      <MoneyCell value={estimated} srLabel="Estimado" />
      <MoneyCell value={actual} srLabel="Real" />

      {/* No celular, margens negativas: os alvos de 44px não somam um vão em branco embaixo da linha. */}
      <div className="-mx-2 -mt-1 -mb-2 flex items-center gap-1 xl:mx-0 xl:-my-1 xl:justify-end">
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
        <span className="flex-1 xl:hidden" aria-hidden="true" />
        <RowActionsMenu
          label="Ações do item"
          editLabel="Editar item"
          deleteLabel="Excluir item"
          describedBy={identityId}
          onEdit={(trigger) => onEdit(item, trigger)}
          onDelete={(trigger) => onDelete(item, trigger)}
        />
      </div>

      {/* Fechado: `hidden` (continua montado). Conteúdo inteiro, sem corte. */}
      <dl
        id={detailsId}
        hidden={!detailsOpen}
        className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-md border border-border bg-bg px-3 py-2.5 text-sm sm:grid-cols-2 xl:col-span-5"
      >
        <Detail label="Descrição" value={item.description} wide />
        <Detail label="Notas" value={item.notes} wide />
        <Detail label="Fornecedor" value={item.vendor} />
        <Detail label="Data" value={item.occurred_on ? formatDateOnly(item.occurred_on) : null} />
        <Detail label="Custo estimado" value={estimated ? `${estimated} — referência, não entra em total do veículo` : null} />
        <Detail label="Custo real" value={actualNote} />
        <Detail label="Link externo" value={item.external_url} wide />
        <Detail label="Anexo" value={item.attachment?.original_filename ?? null} />
      </dl>
    </li>
  );
}
