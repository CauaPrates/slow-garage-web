import { useId, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { RowActionsMenu } from "@/components/ui/menu";
import { formatDateOnly, formatKm, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORY_ICON_BY_SLUG,
  EXPENSE_CATEGORY_ICON_FALLBACK,
  PAYMENT_METHOD_LABELS,
} from "./schemas";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { DeleteExpenseDialog } from "./DeleteExpenseDialog";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseWithAttachment } from "./useExpenses";

type Categories = NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;

type ExpenseRowProps = {
  vehicleId: string;
  expense: ExpenseWithAttachment;
  categories: Categories;
  /** `id` do título da lista — destino do foco quando esta linha some depois de excluída. */
  listTitleId: string;
};

/**
 * Colunas da lista no desktop: descrição e detalhes · categoria · data · valor · ações.
 * O cabeçalho da lista usa o mesmo molde, então as colunas alinham. A partir de
 * `2xl` as colunas dividem a largura em proporção — com as fixas, num monitor
 * largo o valor ia parar a mais de mil pixels da descrição.
 */
export const EXPENSE_ROW_GRID =
  "md:grid-cols-[minmax(0,1fr)_minmax(0,10rem)_6.5rem_8.5rem_2.75rem] md:gap-x-4 2xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_2.75rem] 2xl:gap-x-6";

/**
 * Etapa 05: um lançamento da tela Gastos. A partir de `md`, colunas alinhadas
 * pra comparar valores (cada bloco com lugar explícito na grade).
 *
 * Harmonização 01 — celular no padrão resolvido em Modificações (etapa 10):
 * descrição com quase toda a largura e o "⋯" no canto; embaixo, o valor,
 * "categoria · data" e o resto (fornecedor, pagamento, km, anexo) na largura
 * inteira. Antes o valor reservava uma coluna à direita e cortava "categoria
 * · data" em 360px. A ordem no DOM é a de leitura: descrição, ações, valor,
 * detalhes. Editar e excluir moram no menu "⋯" (mesma forma do menu do card
 * de veículo, etapa 02), com a exclusão separada por divisor e em carmim. A
 * linha em si não é clicável — nada de interativo dentro de interativo.
 *
 * Fechar um diálogo devolve o foco ao "⋯"; depois de excluir, quando a linha
 * sai da lista, o foco vai pro título da lista.
 */
export function ExpenseRow({ vehicleId, expense, categories, listTitleId }: ExpenseRowProps) {
  const identityId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // O "⋯" (do `RowActionsMenu`) — o foco volta pra ele quando um diálogo fecha.
  const triggerRef = useRef<HTMLElement | null>(null);

  const category = categories.find((c) => c.id === expense.category_id) ?? null;
  const Icon = category
    ? (EXPENSE_CATEGORY_ICON_BY_SLUG[category.slug] ?? EXPENSE_CATEGORY_ICON_FALLBACK)
    : EXPENSE_CATEGORY_ICON_FALLBACK;
  const categoryLabel = category?.label ?? "Sem categoria";
  const date = expense.occurred_on ? formatDateOnly(expense.occurred_on) : "Sem data";
  const details = [
    expense.vendor,
    expense.payment_method ? PAYMENT_METHOD_LABELS[expense.payment_method] : null,
    expense.odometer_km != null ? formatKm(expense.odometer_km) : null,
  ].filter(Boolean);

  function focusTrigger() {
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  /*
    A mutação só termina depois do refetch (o `onSuccess` devolve a promessa
    da invalidação), então quando `onDeleted` roda esta linha — e o ref do
    gatilho — já podem ter saído da tela. O gatilho é guardado ao pedir a
    exclusão, num ref que não é ligado a elemento nenhum.
  */
  const removalTriggerRef = useRef<HTMLElement | null>(null);

  function focusAfterRemoval() {
    const trigger = removalTriggerRef.current;
    if (!trigger) return;
    const startedAt = performance.now();
    const check = () => {
      // A lista pode recarregar antes de a confirmação terminar de fechar: espera as duas coisas.
      if (trigger.isConnected || document.querySelector('[role="alertdialog"]')) {
        // Recarregar a lista pode falhar ou demorar; depois de 10s, desiste.
        if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
        return;
      }
      if (document.activeElement && document.activeElement !== document.body) return;
      const target = document.getElementById(listTitleId) ?? document.querySelector<HTMLElement>("main h1");
      if (!target) return;
      target.tabIndex = -1;
      target.focus();
    };
    requestAnimationFrame(check);
  }

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-x-3 gap-y-1 px-(--panel-pad-x) py-3 md:gap-y-0.5",
        EXPENSE_ROW_GRID,
      )}
    >
      {/* Lido como contexto do botão "⋯": qual lançamento ele afeta. */}
      <span id={identityId} className="sr-only">
        {expense.description || "Sem descrição"}, {categoryLabel}, {date}, {formatMoney(expense.amount)}
      </span>

      <p
        className={cn(
          "type-item-title line-clamp-2 pt-0.5 md:col-start-1 md:row-start-1 md:pt-0",
          expense.description ? "text-text-primary" : "font-normal text-text-secondary",
        )}
      >
        {expense.description || "Sem descrição"}
      </p>

      <div className="-my-2.5 flex justify-end md:col-start-5 md:row-span-2 md:row-start-1 md:my-0 md:self-center">
        <RowActionsMenu
          label="Ações do gasto"
          editLabel="Editar gasto"
          deleteLabel="Excluir gasto"
          describedBy={identityId}
          onEdit={(trigger) => {
            triggerRef.current = trigger;
            setEditOpen(true);
          }}
          onDelete={(trigger) => {
            triggerRef.current = trigger;
            removalTriggerRef.current = trigger;
            setDeleteOpen(true);
          }}
        />
      </div>

      {/* Celular: o valor desce para baixo do nome — sem coluna reservada espremendo descrição, categoria e data. */}
      <p className="type-value col-span-2 whitespace-nowrap text-text-primary md:col-span-1 md:col-start-4 md:row-span-2 md:row-start-1 md:self-center md:text-right md:text-sm">
        {formatMoney(expense.amount)}
      </p>

      <div className="col-span-2 flex min-w-0 flex-col gap-0.5 md:col-span-1 md:col-start-1 md:row-start-2">
        <p className="flex min-w-0 items-start gap-1.5 text-xs break-words text-text-secondary md:hidden">
          <Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            {categoryLabel} · {date}
          </span>
        </p>
        {(details.length > 0 || expense.attachment) && (
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-text-secondary">
            {details.length > 0 && <span className="min-w-0 break-words">{details.join(" · ")}</span>}
            {expense.attachment && (
              <span className="inline-flex items-center gap-1 text-text-primary">
                <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                Anexo
              </span>
            )}
          </p>
        )}
      </div>

      <p
        className={cn(
          "hidden min-w-0 items-center gap-2 text-sm md:col-start-2 md:row-span-2 md:row-start-1 md:flex md:self-center",
          category ? "text-text-primary" : "text-text-secondary",
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
        <span className="break-words">{categoryLabel}</span>
      </p>

      <p className="hidden text-sm text-text-secondary tabular-nums md:col-start-3 md:row-span-2 md:row-start-1 md:block md:self-center">
        {expense.occurred_on ? <time dateTime={expense.occurred_on}>{date}</time> : date}
      </p>

      <EditExpenseDialog
        vehicleId={vehicleId}
        expense={expense}
        categories={categories}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) focusTrigger();
        }}
      />
      <DeleteExpenseDialog
        vehicleId={vehicleId}
        expense={expense}
        categoryLabel={category?.label ?? null}
        isUpgrade={category?.slug === "upgrade" && category.user_id === null}
        open={deleteOpen}
        onDeleted={focusAfterRemoval}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) focusTrigger();
        }}
      />
    </li>
  );
}
