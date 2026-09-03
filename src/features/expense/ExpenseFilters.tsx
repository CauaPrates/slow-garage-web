import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PERIODS, PERIOD_LABELS } from "./schemas";
import type { useExpenseCategories } from "./useExpenseCategories";
import type { ExpenseFilters as ExpenseFiltersValue } from "./useExpenses";

type ExpenseFiltersProps = {
  categories: NonNullable<ReturnType<typeof useExpenseCategories>["data"]>;
  value: ExpenseFiltersValue;
  onChange: (value: ExpenseFiltersValue) => void;
};

export function ExpenseFilters({ categories, value, onChange }: ExpenseFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
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
      <div className="flex flex-col gap-1.5">
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
  );
}
