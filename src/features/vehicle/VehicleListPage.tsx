import { useEffect, useId, useMemo, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { useVehicles } from "./useVehicles";
import { VehicleCard } from "./VehicleCard";
import { CreateVehicleDialog } from "./CreateVehicleDialog";
import { GarageCover } from "./GarageCover";
import { GarageDetails, GarageOverview } from "./GarageOverview";
import { GarageToolbar, type GarageView } from "./GarageToolbar";
import {
  matchesSearch,
  sortVehicles,
  STATUS_TABS,
  useGarageSearch,
  type SortOption,
  type StatusFilter,
} from "./garageFilters";

/** Preferência só deste navegador (ordem e grade/lista); sem armazenamento, volta ao padrão. */
function useStoredChoice<T extends string>(key: string, allowed: readonly T[], fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;
    } catch {
      return fallback;
    }
  });
  const update = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  };
  return [value, update] as const;
}

const OPEN_SPECS_SELECTOR = '.garage-card__specs[data-open="true"]';

/**
 * Com uma ficha técnica aberta, a grade passa a `align-items: start` (o card
 * vizinho não estica) — e a vaga livre, que é item da grade, cairia para a
 * altura mínima. Este efeito guarda a altura da vaga com todas as fichas
 * fechadas em `--garage-slot-rest-h`; o CSS a usa como altura mínima enquanto
 * uma ficha está aberta. Se a grade muda de largura com a ficha aberta (as
 * colunas podem mudar), a medida antiga deixa de valer e vira a do maior card
 * fechado.
 */
function useSlotRestHeight(grid: HTMLDivElement | null, layoutKey: string) {
  useEffect(() => {
    if (!grid || typeof ResizeObserver === "undefined") return;
    let measuredWidth = 0;
    const measure = () => {
      const slot = grid.querySelector<HTMLElement>(":scope > .garage-slot");
      if (!slot) return;
      const width = grid.clientWidth;
      if (!grid.querySelector(OPEN_SPECS_SELECTOR)) {
        grid.style.setProperty("--garage-slot-rest-h", `${slot.offsetHeight}px`);
        measuredWidth = width;
      } else if (width !== measuredWidth) {
        // A medida do repouso não vale mais: usa o maior card fechado (a altura que a linha teria sem a ficha).
        const closed = [...grid.querySelectorAll<HTMLElement>(":scope > article")].filter(
          (card) => !card.querySelector(OPEN_SPECS_SELECTOR),
        );
        const tallest = Math.max(0, ...closed.map((card) => card.offsetHeight));
        if (tallest > 0) grid.style.setProperty("--garage-slot-rest-h", `${tallest}px`);
        else grid.style.removeProperty("--garage-slot-rest-h");
        measuredWidth = width;
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    const slot = grid.querySelector(":scope > .garage-slot");
    if (slot) observer.observe(slot);
    measure();
    return () => observer.disconnect();
  }, [grid, layoutKey]);
}

/**
 * Minha garagem — Garagem A3 + capa A3.1 (ADR-094): composição de revista
 * automotiva japonesa traduzida em interface, sem caricatura e sem depender
 * de carro japonês.
 *
 * - Capa (`GarageCover`): compacta no celular; no desktop, página dupla com
 *   colagem fotográfica à direita.
 * - Resumo (`GarageOverview`): faixa de dados colada à capa, com
 *   "Detalhes e comparativo" — o painel (`GarageDetails`) abre logo abaixo.
 * - Coleção (ADR-096): barra com busca (no celular; no desktop ela fica no
 *   cabeçalho), abas por status com contagem, ordenação e grade/lista, como
 *   na referência. "Seus veículos (N)" continua como título, só para leitor
 *   de tela. Cards verticais
 *   (revisão dos cards, ADR-095) em quantas colunas couberem com ~336 px,
 *   cada um até ~440 px (488 no largo). Com poucos veículos só a grade
 *   encolhe e fica na margem, embaixo do título (alinhada à capa e ao resumo).
 *
 * Capa, resumo e coleção começam na mesma margem depois da sidebar (40 px no
 * notebook, 56 px no largo), sem largura máxima nem centralização.
 */
export function VehicleListPage() {
  const { data: vehicles, isLoading, isError, refetch } = useVehicles();
  const { data: categories } = useExpenseCategories();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const hasVehicles = !isLoading && !isError && vehicles && vehicles.length > 0;
  const [query, setQuery] = useGarageSearch();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useStoredChoice<SortOption>("slow-garage:garage-sort", ["recent", "oldest", "name", "invested", "odometer"], "recent");
  const [view, setView] = useStoredChoice<GarageView>("slow-garage:garage-view", ["grid", "list"], "grid");

  const searched = useMemo(() => (vehicles ?? []).filter((v) => matchesSearch(v, query)), [vehicles, query]);
  const counts = useMemo(() => {
    const result = { all: searched.length, active: 0, project: 0, stored: 0, sold: 0 } as Record<StatusFilter, number>;
    for (const v of searched) result[v.status] += 1;
    return result;
  }, [searched]);
  const visible = useMemo(
    () => sortVehicles(status === "all" ? searched : searched.filter((v) => v.status === status), sort),
    [searched, status, sort],
  );
  const filtering = query.trim() !== "" || status !== "all";
  const statusTab = STATUS_TABS.find((tab) => tab.value === status)!;
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null);
  // A vaga entra e sai com o filtro e muda de forma com a lista: mede de novo.
  useSlotRestHeight(gridElement, `${filtering}-${view}-${visible.length}`);

  return (
    <div className="garage-page">
      <GarageCover showCreate={Boolean(hasVehicles)} />

      {hasVehicles && (
        <>
          <GarageOverview
            vehicles={vehicles}
            details={{ open: detailsOpen, onToggle: () => setDetailsOpen((open) => !open), controlsId: detailsId }}
          />
          <GarageDetails vehicles={vehicles} id={detailsId} open={detailsOpen} />
        </>
      )}

      {isLoading && (
        <div className="garage-gutter flex flex-col gap-5 pt-1 lg:pt-0" aria-busy="true">
          <span className="sr-only">Carregando sua garagem…</span>
          <div className="h-14 animate-pulse rounded-sm bg-surface lg:h-18" aria-hidden="true" />
          <div className="garage-collection" aria-hidden="true">
            <div className="garage-grid">
              {[1, 2].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-sm bg-surface lg:h-64" />
              ))}
            </div>
          </div>
        </div>
      )}

      {isError && (
        <div className="garage-gutter pt-2">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
            <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Não foi possível carregar sua garagem.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && vehicles?.length === 0 && (
        <div className="garage-gutter pt-2">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-12 text-center">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-text-primary">Nenhum veículo cadastrado ainda.</p>
              <p className="text-sm text-text-secondary">
                Cadastre o primeiro pra começar a registrar gastos, abastecimentos e manutenções.
              </p>
            </div>
            <CreateVehicleDialog triggerLabel="Cadastrar meu primeiro veículo" />
          </div>
        </div>
      )}

      {hasVehicles && (
        <section aria-labelledby="garage-vehicles-title" className="garage-collection garage-gutter">
          {/* Visualmente a contagem está em "Todos (N)"; o título fica para leitor de tela e é o alvo do foco depois de excluir. */}
          <h2 id="garage-vehicles-title" className="sr-only">
            {vehicles.length === 1 ? "Seu veículo" : `Seus veículos (${vehicles.length})`}
          </h2>
          <GarageToolbar
            counts={counts}
            status={status}
            onStatusChange={setStatus}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
          />
          <p className="sr-only" aria-live="polite">
            {filtering
              ? `${visible.length} ${visible.length === 1 ? "veículo encontrado" : "veículos encontrados"}`
              : ""}
          </p>
          {visible.length > 0 ? (
            <div ref={setGridElement} className="garage-grid" data-view={view}>
              {visible.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} categories={categories} />
              ))}
              {/*
                "Vaga livre" (ADR-097): o último lugar da grade é o próprio cadastro —
                o mesmo diálogo do botão da capa, não um card fictício. Só sem
                busca e sem filtro (no meio de um resultado filtrado não faz sentido).
                Nome acessível: "Estacionar veículo" (o diálogo é o de cadastro).
              */}
              {!filtering && (
                <CreateVehicleDialog
                  triggerClassName="garage-slot"
                  triggerLabel={
                    <>
                      <span className="garage-slot__plus" aria-hidden="true">
                        <Plus className="h-5 w-5" />
                      </span>
                      <span className="garage-slot__eyebrow" aria-hidden="true">
                        Vaga livre
                      </span>
                      <span className="garage-slot__title">Estacionar veículo</span>
                    </>
                  }
                />
              )}
            </div>
          ) : (
            <div className="garage-filter-empty">
              <p className="text-sm text-text-secondary">
                {query.trim()
                  ? `Nenhum veículo encontrado para “${query.trim()}”${status !== "all" ? ` em ${statusTab.label}` : ""}.`
                  : `${statusTab.empty}.`}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                {query.trim() ? "Limpar busca e filtros" : "Ver todos"}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
