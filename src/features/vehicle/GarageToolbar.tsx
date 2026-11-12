import { LayoutGrid, List } from "lucide-react";
import { Select } from "@/components/ui/select";
import { GarageSearchField } from "./GarageSearchField";
import { SORT_OPTIONS, STATUS_TABS, type SortOption, type StatusFilter } from "./garageFilters";

export type GarageView = "grid" | "list";

type GarageToolbarProps = {
  counts: Record<StatusFilter, number>;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  view: GarageView;
  onViewChange: (view: GarageView) => void;
};

/**
 * Barra da coleção (ADR-096), como na referência: abas por status com a
 * contagem, "Mais recente" e grade/lista à direita.
 *
 * - Abas são botões de alternância (`aria-pressed`) num grupo — filtram a
 *   lista que já está na página, não trocam de painel. Contagem já com a
 *   busca aplicada; aba com zero continua clicável (mostra o vazio).
 * - No celular as abas rolam na horizontal dentro da própria faixa, e a
 *   busca aparece aqui (no desktop ela fica no cabeçalho).
 * - Grade/lista some quando a coleção só comporta uma coluna (`garage.css`).
 */
export function GarageToolbar({
  counts,
  status,
  onStatusChange,
  sort,
  onSortChange,
  view,
  onViewChange,
}: GarageToolbarProps) {
  return (
    <div className="garage-toolbar">
      <GarageSearchField className="garage-toolbar__search flex lg:hidden" />

      <div className="garage-tabs" role="group" aria-label="Filtrar por status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={status === tab.value}
            onClick={() => onStatusChange(tab.value)}
            className="garage-tab"
          >
            {tab.label} <span className="garage-tab__count">({counts[tab.value]})</span>
          </button>
        ))}
      </div>

      <div className="garage-toolbar__controls">
        <Select
          aria-label="Ordenar veículos"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
          className="garage-sort"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="garage-view" role="group" aria-label="Visualização">
          <button
            type="button"
            aria-pressed={view === "grid"}
            aria-label="Ver em grade"
            data-tip="Ver em grade"
            data-tip-side="bottom"
            onClick={() => onViewChange("grid")}
            className="garage-view__button"
          >
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            aria-label="Ver em lista"
            data-tip="Ver em lista"
            data-tip-side="bottom"
            onClick={() => onViewChange("list")}
            className="garage-view__button"
          >
            <List className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
