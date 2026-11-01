import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PERIODS, PERIOD_LABELS } from "@/lib/period";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseFilters as ExpenseFiltersValue } from "./useExpenses";

type ExpenseFiltersProps = {
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  value: ExpenseFiltersValue;
  onChange: (value: ExpenseFiltersValue) => void;
  /** Aparece só com algum filtro ativo. */
  onClear?: () => void;
};

/**
 * Etapa 05: os mesmos dois filtros (categoria e período de `period.ts`, com
 * as mesmas opções e o mesmo critério por `occurred_on` no servidor), lado a
 * lado também no celular — são curtos — e com largura fixa a partir de `sm`,
 * em vez de dividir a tela inteira. "Limpar filtros" só aparece com filtro
 * ativo.
 */
export function ExpenseFilters({ categories, value, onChange, onClear }: ExpenseFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:flex sm:flex-none">
        <div className="flex min-w-0 flex-col gap-1.5 sm:w-52">
          <Label htmlFor="filter-category">Categoria</Label>
          <Select
            id="filter-category"
            value={value.categoryId}
            onChange={(event) => onChange({ ...value, categoryId: event.target.value })}
          >
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 sm:w-44">
          <Label htmlFor="filter-period">Período</Label>
          <Select
            id="filter-period"
            value={value.period}
            onChange={(event) =>
              onChange({ ...value, period: event.target.value as ExpenseFiltersValue["period"] })
            }
          >
            {PERIODS.map((period) => (
              <option key={period} value={period}>
                {PERIOD_LABELS[period]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {onClear && (
        <Button type="button" variant="ghost" onClick={onClear} className="px-3">
          <X className="h-4 w-4" aria-hidden="true" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
