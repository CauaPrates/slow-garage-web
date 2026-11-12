import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterField } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { PERIODS, PERIOD_LABELS } from "@/lib/period";
import { cn } from "@/lib/utils";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseFilters as ExpenseFiltersValue } from "./useExpenses";

type ExpenseFiltersProps = {
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  value: ExpenseFiltersValue;
  onChange: (value: ExpenseFiltersValue) => void;
  /** Aparece só com algum filtro ativo. */
  onClear?: () => void;
  className?: string;
};

/**
 * Etapa 05: os mesmos dois filtros (categoria e período de `period.ts`, com
 * as mesmas opções e o mesmo critério por `occurred_on` no servidor), lado a
 * lado também no celular — são curtos — e com largura fixa a partir de `sm`,
 * em vez de dividir a tela inteira. "Limpar filtros" só aparece com filtro
 * ativo.
 */
export function ExpenseFilters({ categories, value, onChange, onClear, className }: ExpenseFiltersProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:flex sm:flex-none">
        <FilterField id="filter-category" label="Categoria" className="sm:w-52">
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
        </FilterField>
        <FilterField id="filter-period" label="Período" className="sm:w-44">
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
        </FilterField>
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
