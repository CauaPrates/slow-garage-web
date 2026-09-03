import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PERIODS, PERIOD_LABELS, type Period } from "@/lib/period";
import { TIMELINE_EVENT_TYPES, TIMELINE_EVENT_TYPE_LABELS } from "./schemas";
import type { TimelineTypeFilter } from "./useTimeline";

type TimelineFiltersValue = {
  type: TimelineTypeFilter;
  period: Period;
};

type TimelineFiltersProps = {
  value: TimelineFiltersValue;
  onChange: (value: TimelineFiltersValue) => void;
};

export function TimelineFilters({ value, onChange }: TimelineFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-type">Tipo</Label>
        <Select
          id="filter-type"
          value={value.type}
          onChange={(event) => onChange({ ...value, type: event.target.value })}
        >
          <option value="all">Todos</option>
          {TIMELINE_EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {TIMELINE_EVENT_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-period">Período</Label>
        <Select
          id="filter-period"
          value={value.period}
          onChange={(event) => onChange({ ...value, period: event.target.value as Period })}
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
