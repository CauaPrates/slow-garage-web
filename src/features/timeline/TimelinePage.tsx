import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle, Search, X } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/routes";
import type { Period } from "@/lib/period";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateNoteDialog } from "./CreateNoteDialog";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineItem } from "./TimelineItem";
import { SearchResultItem } from "./SearchResultItem";
import { filterTimelineEvents, useTimeline, type TimelineTypeFilter } from "./useTimeline";
import { useVehicleSearch } from "./useVehicleSearch";

export function TimelinePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createNoteOpen, setCreateNoteOpen] = useState(() => searchParams.get("novo") === "1");
  const [filters, setFilters] = useState<{ type: TimelineTypeFilter; period: Period }>({
    type: "all",
    period: "all",
  });
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const timelineQuery = useTimeline(vehicleId ?? "");
  const searchQuery = useVehicleSearch(vehicleId ?? "", debouncedSearch);
  const isSearching = debouncedSearch.trim().length > 0;

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  if (vehicleLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar o histórico.</p>
        <Button variant="ghost" onClick={() => refetchVehicle()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-text-primary">Veículo não encontrado.</p>
        <Link to={ROUTES.home} className="text-sm text-accent underline">
          Voltar para a garagem
        </Link>
      </div>
    );
  }

  const events = timelineQuery.data ?? [];
  const filteredEvents = filterTimelineEvents(events, filters);
  const searchResults = searchQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb items={[{ label: "Histórico" }]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-medium text-text-primary">Histórico</h1>
        <Button onClick={() => setCreateNoteOpen(true)}>Nova nota</Button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar neste veículo…"
          aria-label="Buscar neste veículo"
          className="pl-9"
        />
        {searchInput && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setSearchInput("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isSearching ? (
        <div className="flex flex-col gap-3">
          {searchQuery.isLoading && (
            <div className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          )}
          {searchQuery.isError && (
            <p className="text-sm text-error">Não foi possível buscar. Tente de novo.</p>
          )}
          {!searchQuery.isLoading && !searchQuery.isError && searchResults.length === 0 && (
            <p className="text-sm text-text-secondary">
              Nada encontrado para "{debouncedSearch}".
            </p>
          )}
          {searchResults.map((result) => (
            <SearchResultItem
              key={`${result.source_table}-${result.source_id}`}
              vehicleId={vehicle.id}
              result={result}
            />
          ))}
        </div>
      ) : (
        <>
          <TimelineFilters value={filters} onChange={setFilters} />

          {timelineQuery.isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
              ))}
            </div>
          )}

          {timelineQuery.isError && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
              <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
              <p className="text-sm text-text-secondary">Não foi possível carregar o histórico.</p>
              <Button variant="ghost" onClick={() => timelineQuery.refetch()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {!timelineQuery.isLoading && !timelineQuery.isError && events.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
              <p className="text-text-primary">Nenhum evento ainda.</p>
              <Button onClick={() => setCreateNoteOpen(true)}>Adicionar a primeira nota</Button>
            </div>
          )}

          {!timelineQuery.isLoading && !timelineQuery.isError && events.length > 0 && (
            <div className="flex flex-col gap-3">
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-text-secondary">
                    Nenhum evento com o filtro atual.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setFilters({ type: "all", period: "all" })}
                  >
                    Limpar filtro
                  </Button>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <TimelineItem
                    key={`${event.source_table}-${event.source_id}`}
                    vehicleId={vehicle.id}
                    event={event}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      <CreateNoteDialog
        vehicleId={vehicle.id}
        open={createNoteOpen}
        onOpenChange={setCreateNoteOpen}
      />
    </div>
  );
}
