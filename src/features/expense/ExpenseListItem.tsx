import { useState } from "react";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateOnly, formatMoney } from "@/lib/format";
import {
  EXPENSE_CATEGORY_ICON_BY_SLUG,
  EXPENSE_CATEGORY_ICON_FALLBACK,
  PAYMENT_METHOD_LABELS,
} from "./schemas";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { DeleteExpenseDialog } from "./DeleteExpenseDialog";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseWithAttachment } from "./useExpenses";

type ExpenseListItemProps = {
  vehicleId: string;
  expense: ExpenseWithAttachment;
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
};

export function ExpenseListItem({ vehicleId, expense, categories }: ExpenseListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const category = categories.find((c) => c.id === expense.category_id);
  const Icon = category
    ? (EXPENSE_CATEGORY_ICON_BY_SLUG[category.slug] ?? EXPENSE_CATEGORY_ICON_FALLBACK)
    : EXPENSE_CATEGORY_ICON_FALLBACK;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{expense.description}</p>
          <p className="text-sm text-text-secondary">
            {category?.label ?? "Categoria"} · {formatDateOnly(expense.occurred_on)}
            {expense.vendor ? ` · ${expense.vendor}` : ""}
            {expense.payment_method ? ` · ${PAYMENT_METHOD_LABELS[expense.payment_method]}` : ""}
          </p>
          {expense.attachment && (
            <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
              <Paperclip className="h-3 w-3" aria-hidden="true" />
              {expense.attachment.original_filename}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-medium text-text-primary">{formatMoney(expense.amount)}</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar gasto"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir gasto"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditExpenseDialog
        vehicleId={vehicleId}
        expense={expense}
        categories={categories}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteExpenseDialog
        vehicleId={vehicleId}
        expense={expense}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
