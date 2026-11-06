import { useId, useState } from "react";
import { Paperclip } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/features/expense/schemas";
import { RowActionsMenu } from "@/components/ui/menu";
import type { ExpenseWithAttachment } from "@/features/expense/useExpenses";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Colunas a partir de `md`: modificação (e detalhes) · data · valor · "⋯". O
 * cabeçalho da lista usa o mesmo molde. A partir de `2xl` as colunas dividem
 * a largura em proporção — com as fixas, num monitor largo o valor ficava
 * longe demais do nome (a mesma lição de Gastos, ADR-088).
 */
export const MODIFICATION_ROW_GRID =
  "md:grid-cols-[minmax(0,1fr)_7rem_9rem_2.75rem] md:gap-x-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] 2xl:gap-x-6";

/** Nota curta cabe inteira em duas linhas; acima disso (ou com quebra de linha) ganha "Ver nota inteira". */
const LONG_NOTES_CHARS = 140;

type ModificationRowProps = {
  upgrade: ExpenseWithAttachment;
  onEdit: (upgrade: ExpenseWithAttachment, trigger: HTMLElement | null) => void;
  onDelete: (upgrade: ExpenseWithAttachment, trigger: HTMLElement | null) => void;
};

/**
 * Etapa 10: um upgrade (gasto da categoria Upgrade). Hierarquia: o que foi
 * feito, o valor, a data e os metadados (fornecedor, pagamento, km), o anexo
 * e, por último, a nota.
 *
 * Celular (ajuste da revisão): nome com quase toda a largura e o "⋯" no canto;
 * embaixo, valor e "data · metadados"; anexo e nota na largura inteira — antes
 * o valor reservava uma coluna à direita e prendia tudo numa faixa estreita.
 * A partir de `md`, cada bloco tem lugar explícito nas colunas de sempre
 * (nome e detalhes · data · valor · "⋯"); a ordem no DOM é a do celular, que
 * também é a ordem de leitura: nome, ações, valor, detalhes.
 *
 * Nada é cortado sem caminho de volta: o nome quebra; a nota passa de duas
 * linhas só com "Ver nota inteira" (`aria-expanded`). Editar e excluir moram no
 * "⋯" (o mesmo menu de Projetos); a linha não é clicável. Os diálogos ficam na
 * página — um upgrade editado pode sair da busca e desmontar a linha.
 */
export function ModificationRow({ upgrade, onEdit, onDelete }: ModificationRowProps) {
  const identityId = useId();
  const notesId = useId();
  const [notesOpen, setNotesOpen] = useState(false);

  const name = upgrade.description || "Sem descrição";
  const date = formatDateOnly(upgrade.occurred_on);
  const amount = formatMoney(upgrade.amount);
  const details = [
    upgrade.vendor,
    upgrade.payment_method ? PAYMENT_METHOD_LABELS[upgrade.payment_method] : null,
    upgrade.odometer_km != null ? formatKm(upgrade.odometer_km) : null,
  ].filter(Boolean);
  const notes = upgrade.notes?.trim() ? upgrade.notes : null;
  const longNotes = !!notes && (notes.length > LONG_NOTES_CHARS || notes.includes("\n"));

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-x-2 gap-y-1 px-(--panel-pad-x) py-3",
        MODIFICATION_ROW_GRID,
      )}
    >
      {/* Lido como contexto do "⋯": qual upgrade ele afeta. */}
      <span id={identityId} className="sr-only">
        {name}, {date}, {amount}
      </span>

      <p
        className={cn(
          "type-item-title pt-0.5 md:col-start-1 md:row-start-1 md:pt-px",
          upgrade.description ? "text-text-primary" : "font-normal text-text-secondary",
        )}
      >
        {name}
      </p>

      <div className="-my-2.5 flex justify-end md:col-start-4 md:row-start-1">
        <RowActionsMenu
          label="Ações do upgrade"
          editLabel="Editar upgrade"
          deleteLabel="Excluir upgrade"
          describedBy={identityId}
          onEdit={(trigger) => onEdit(upgrade, trigger)}
          onDelete={(trigger) => onDelete(upgrade, trigger)}
        />
      </div>

      <p className="type-value col-span-2 whitespace-nowrap text-text-primary md:col-span-1 md:col-start-3 md:row-start-1 md:pt-px md:text-right">
        {amount}
      </p>

      <div className="col-span-2 flex min-w-0 flex-col gap-1 md:col-span-1 md:col-start-1 md:row-start-2">
        {/* No celular a data abre esta linha; no desktop ela tem coluna. */}
        <p className="text-xs break-words text-text-secondary tabular-nums">
          <time dateTime={upgrade.occurred_on} className="md:hidden">
            {date}
          </time>
          {details.length > 0 && (
            <>
              <span className="md:hidden"> · </span>
              {details.join(" · ")}
            </>
          )}
        </p>
        {upgrade.attachment && (
          <p className="flex min-w-0 items-start gap-1 text-xs text-text-primary">
            <Paperclip className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-all">
              <span className="sr-only">Anexo: </span>
              {upgrade.attachment.original_filename}
            </span>
          </p>
        )}
        {notes && (
          <div className="flex min-w-0 flex-col items-start">
            <p
              id={notesId}
              className={cn(
                "max-w-prose text-xs break-words whitespace-pre-wrap text-text-secondary",
                longNotes && !notesOpen && "line-clamp-2",
              )}
            >
              <span className="sr-only">Nota: </span>
              {notes}
            </p>
            {longNotes && (
              <button
                type="button"
                aria-expanded={notesOpen}
                aria-controls={notesId}
                aria-describedby={identityId}
                onClick={() => setNotesOpen((open) => !open)}
                className="-my-2.5 -ml-1 inline-flex min-h-11 items-center rounded-md px-1 text-xs font-medium text-text-primary underline decoration-border-strong underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-text-primary"
              >
                {notesOpen ? "Recolher nota" : "Ver nota inteira"}
              </button>
            )}
          </div>
        )}
      </div>

      <p className="hidden pt-px text-sm text-text-secondary tabular-nums md:col-start-2 md:row-start-1 md:block">
        <time dateTime={upgrade.occurred_on}>{date}</time>
      </p>
    </li>
  );
}
