import { useId, useRef, useState } from "react";
import { MoreHorizontal, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const MENU_ITEM_CLASSNAME =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors duration-(--duration-fast)";

/**
 * Etapa 05: um lançamento da tela Gastos. No celular, descrição e valor na
 * primeira linha, categoria · data embaixo e o resto (fornecedor, pagamento,
 * km, anexo) numa terceira; a partir de `md`, colunas alinhadas pra comparar
 * valores. Editar e excluir moram no menu "⋯" (mesma forma do menu do card
 * de veículo, etapa 02), com a exclusão separada por divisor e em carmim. A
 * linha em si não é clicável — nada de interativo dentro de interativo.
 *
 * Fechar um diálogo devolve o foco ao "⋯"; depois de excluir, quando a linha
 * sai da lista, o foco vai pro título da lista.
 */
export function ExpenseRow({ vehicleId, expense, categories, listTitleId }: ExpenseRowProps) {
  const identityId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
        "grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-start gap-x-3 px-4 py-3 md:items-center",
        EXPENSE_ROW_GRID,
      )}
    >
      {/* Lido como contexto do botão "⋯": qual lançamento ele afeta. */}
      <span id={identityId} className="sr-only">
        {expense.description || "Sem descrição"}, {categoryLabel}, {date}, {formatMoney(expense.amount)}
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p
          className={cn(
            "line-clamp-2 text-sm break-words",
            expense.description ? "font-medium text-text-primary" : "text-text-secondary",
          )}
        >
          {expense.description || "Sem descrição"}
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-text-secondary md:hidden">
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
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
          "hidden min-w-0 items-center gap-2 text-sm md:flex",
          category ? "text-text-primary" : "text-text-secondary",
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
        <span className="break-words">{categoryLabel}</span>
      </p>

      <p className="hidden text-sm text-text-secondary tabular-nums md:block">
        {expense.occurred_on ? <time dateTime={expense.occurred_on}>{date}</time> : date}
      </p>

      <p className="pt-px text-right font-mono text-sm whitespace-nowrap text-text-primary tabular-nums md:pt-0">
        {formatMoney(expense.amount)}
      </p>

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            aria-label="Ações do gasto"
            aria-describedby={identityId}
            className="-my-2.5 text-text-secondary hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary md:my-0"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1.5" align="end" aria-label="Ações do gasto">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setEditOpen(true);
            }}
            className={`${MENU_ITEM_CLASSNAME} text-text-primary hover:bg-state-hover`}
          >
            <Pencil className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            Editar gasto
          </button>
          <div className="my-1.5 h-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              removalTriggerRef.current = triggerRef.current;
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
            className={`${MENU_ITEM_CLASSNAME} text-error hover:bg-error/10`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir gasto
          </button>
        </PopoverContent>
      </Popover>

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
