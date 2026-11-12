import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { History, Plus, X } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, NoResults, PageError } from "@/components/ui/feedback";
import { FilterField } from "@/components/ui/form";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { formatCount } from "@/lib/format";
import { PERIODS, PERIOD_LABELS, type Period } from "@/lib/period";
import { cn } from "@/lib/utils";
import { CreateNoteDialog } from "./CreateNoteDialog";
import { DeleteNoteDialog } from "./DeleteNoteDialog";
import { EditNoteDialog } from "./EditNoteDialog";
import { TIMELINE_EVENT_TYPES, TIMELINE_EVENT_TYPE_LABELS } from "./schemas";
import { TIMELINE_ROW_GRID, TimelineEntryRow } from "./TimelineEntryRow";
import { entryFromEvent, entryFromSearch, groupByMonth, noteFromEvent, type TimelineEntry } from "./timelinePresentation";
import type { NoteLike } from "./useNotes";
import { filterTimelineEvents, useTimeline, type TimelineTypeFilter } from "./useTimeline";
import { useVehicleSearch } from "./useVehicleSearch";

const LIST_TITLE_ID = "timeline-list-title";
const CREATE_ACTION_ID = "timeline-create-note";

/** Espera o diálogo sair e, se o foco caiu no `<body>` (o gatilho sumiu), leva ao título da lista (ou ao `h1`). */
function focusListTitleIfLost(trigger: HTMLElement | null = null) {
  const startedAt = performance.now();
  const check = () => {
    // Depois de excluir, a linha (e o "⋯") ainda pode estar na tela por um quadro: espera ela sair também.
    if (trigger?.isConnected || document.querySelector('[role="dialog"], [role="alertdialog"]')) {
      if (performance.now() - startedAt < 10_000) requestAnimationFrame(check);
      return;
    }
    if (document.activeElement && document.activeElement !== document.body) return;
    const target = document.getElementById(LIST_TITLE_ID) ?? document.querySelector<HTMLElement>("main h1");
    if (!target) return;
    target.tabIndex = -1;
    target.focus();
  };
  requestAnimationFrame(check);
}

export function TimelinePage() {
  const { vehicleId = "" } = useParams<{ vehicleId: string }>();
  // Trocar de veículo remonta a tela inteira (busca, filtros, diálogos), como nas outras telas do veículo.
  return <TimelineWorkspace key={vehicleId} vehicleId={vehicleId} />;
}

type NoteTarget = { note: NoteLike; trigger: HTMLElement | null };

/**
 * Etapa 13: o Histórico como diário do veículo. Mesma consulta
 * (`vehicle_timeline` inteira, data mais recente primeiro, na ordem que a
 * view devolve), mesma busca (`search_vehicle`, por relevância, 300 ms depois
 * da digitação), mesmos filtros de tipo e período (no cliente, só sobre a
 * lista) e os mesmos hooks de nota. `?novo=1` abre a nota nova e sai da URL.
 *
 * Cabeçalho comum (título, veículo e quantidade, "Nova nota") → um painel com
 * a busca e os filtros no topo e os registros agrupados por mês. Buscando, o
 * painel mostra os resultados da busca no lugar da lista (tipo e período não
 * se aplicam a ela, como antes, e saem de vista).
 */
function TimelineWorkspace({ vehicleId }: { vehicleId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(() => searchParams.get("novo") === "1");
  const [filters, setFilters] = useState<{ type: TimelineTypeFilter; period: Period }>({ type: "all", period: "all" });
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // A nota aberta fica aqui, não na linha: editada, ela pode sair do filtro e desmontar a linha.
  const [editing, setEditing] = useState<NoteTarget | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<NoteTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deletedRef = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  const vehicleQuery = useVehicle(vehicleId);
  const timelineQuery = useTimeline(vehicleId);
  const searchQuery = useVehicleSearch(vehicleId, debouncedSearch);
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

  if (vehicleQuery.isLoading) {
    return (
      <Page aria-busy="true">
        <span className="sr-only">Carregando histórico…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="h-64 rounded-lg border border-border bg-surface" />
      </Page>
    );
  }
  if (vehicleQuery.isError) {
    return <PageError message="Não foi possível carregar o veículo." onRetry={() => void vehicleQuery.refetch()} />;
  }
  const vehicle = vehicleQuery.vehicle;
  if (!vehicle) {
    return <VehicleNotFound />;
  }

  const vehicleName = `${vehicle.make} ${vehicle.model}`;
  const events = timelineQuery.data ?? [];
  const listReady = timelineQuery.isSuccess;
  const empty = listReady && events.length === 0;
  const filteredEvents = filterTimelineEvents(events, filters);
  const filtered = filters.type !== "all" || filters.period !== "all";
  const entries = filteredEvents.map((event) => entryFromEvent(vehicle.id, event));
  const months = groupByMonth(entries);

  // A busca devolve só um trecho da nota: editar usa a nota inteira, lida da lista do Histórico.
  const notesById = new Map(events.flatMap((event) => {
    const note = noteFromEvent(event);
    return note ? [[note.id, note] as const] : [];
  }));
  const searchEntries = (searchQuery.data ?? []).map((result) =>
    entryFromSearch(vehicle.id, result, result.source_table === "notes" ? (notesById.get(result.source_id) ?? null) : null),
  );

  const selectionLabel = [
    filters.type !== "all" && (TIMELINE_EVENT_TYPE_LABELS[filters.type as keyof typeof TIMELINE_EVENT_TYPE_LABELS] ?? filters.type),
    filters.period !== "all" && PERIOD_LABELS[filters.period],
  ]
    .filter(Boolean)
    .join(" · ");
  const outside = events.length - filteredEvents.length;

  function openCreate() {
    setCreateOpen(true);
  }

  function editNote(note: NoteLike, trigger: HTMLElement | null) {
    setEditing({ note, trigger });
    setEditOpen(true);
  }

  function deleteNote(note: NoteLike, trigger: HTMLElement | null) {
    deletedRef.current = false;
    setDeleting({ note, trigger });
    setDeleteOpen(true);
  }

  function restoreFocus(trigger: HTMLElement | null) {
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
      else focusListTitleIfLost();
    });
  }

  function renderRows(list: TimelineEntry[], byDay: boolean) {
    return list.map((entry, index) => (
      <TimelineEntryRow
        key={entry.key}
        entry={entry}
        sameDayAsPrevious={byDay && index > 0 && !!entry.date && list[index - 1].date === entry.date}
        onEditNote={editNote}
        onDeleteNote={deleteNote}
      />
    ));
  }

  const columns = (
    <ListColumns className={TIMELINE_ROW_GRID}>
      <span>Data</span>
      <span>Registro</span>
      <span className="text-right">Valor</span>
      <span />
    </ListColumns>
  );

  return (
    <Page>
      <Breadcrumb items={[{ label: "Histórico" }]} />

      {/* Abaixo de `sm` a ação desce: o veículo (nome que pode ser longo) e a contagem ficam com a largura toda. */}
      <PageHeader
        title="Histórico"
        stackActionsOnMobile
        description={
          <>
            {vehicleName}
            {listReady && " · "}
            {/* A contagem e o "i" quebram juntos: o botão nunca fica sozinho numa linha. */}
            <span className="whitespace-nowrap">
              {listReady && `${formatCount(events.length)} ${events.length === 1 ? "registro" : "registros"}`}
              <InfoTip label="O que entra no Histórico" className="-my-3 -ml-1">
                <p>
                  Gastos, abastecimentos, manutenções, problemas, itens de projeto com data e documentos entram sozinhos,
                  na data de cada um. Para mudar um deles, use “Ver” e edite na tela de origem.
                </p>
                <p>Notas são escritas aqui; editar e excluir ficam no “⋯” de cada nota.</p>
                <p>Obrigações e financiamento não entram.</p>
              </InfoTip>
            </span>
          </>
        }
        actions={
          !empty && (
            <Button id={CREATE_ACTION_ID} onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova nota
            </Button>
          )
        }
      />

      <p role="status" className="sr-only">
        {announcement}
      </p>

      {empty ? (
        <EmptyState
          icon={History}
          titleId={LIST_TITLE_ID}
          title="Nada registrado neste veículo ainda."
          action={<Button onClick={openCreate}>Escrever primeira nota</Button>}
        >
          Gastos, abastecimentos, manutenções, problemas, itens de projeto com data e documentos aparecem aqui sozinhos,
          na data de cada um. Notas você escreve aqui.
        </EmptyState>
      ) : (
        <section aria-labelledby={LIST_TITLE_ID} className={PANEL_CLASSNAME}>
          <PanelHeader
            title={isSearching ? "Resultados da busca" : "Registros"}
            titleId={LIST_TITLE_ID}
            description={
              isSearching
                ? "Por relevância, em todo o veículo. Tipo e período não se aplicam à busca."
                : "Do mais recente para o mais antigo."
            }
            action={
              <PanelCount>
                {isSearching
                  ? searchQuery.isSuccess &&
                    `${formatCount(searchEntries.length)} ${searchEntries.length === 1 ? "resultado" : "resultados"}`
                  : listReady &&
                    (filtered
                      ? `${formatCount(filteredEvents.length)} de ${formatCount(events.length)} registros`
                      : `${formatCount(events.length)} ${events.length === 1 ? "registro" : "registros"}`)}
              </PanelCount>
            }
          />

          {/*
            Abaixo de 400px os três empilham (as opções aparecem inteiras em 320–390). De 400 até `sm`: a busca em
            cima e os dois seletores lado a lado. Buscando, tipo e período saem de vista (não valem para a busca).
          */}
          <div
            className={cn(
              "grid grid-cols-1 gap-3 border-b border-border px-(--panel-pad-x) py-(--panel-pad-y)",
              !isSearching && "min-[25rem]:grid-cols-2 sm:grid-cols-[minmax(0,1fr)_11rem_10rem]",
            )}
          >
            <FilterField id="timeline-search" label="Buscar no veículo" className="min-[25rem]:col-span-2 sm:col-span-1">
              <div className="relative">
                <Input
                  id="timeline-search"
                  type="search"
                  placeholder="Título ou texto"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="pr-11 [&::-webkit-search-cancel-button]:appearance-none"
                />
                {searchInput && (
                  <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() => {
                      setSearchInput("");
                      setDebouncedSearch("");
                      document.getElementById("timeline-search")?.focus();
                    }}
                    className="absolute inset-y-0 right-0 flex size-control items-center justify-center rounded-md text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </FilterField>
            {!isSearching && (
              <>
                <FilterField id="timeline-type" label="Tipo">
                  <Select
                    id="timeline-type"
                    value={filters.type}
                    onChange={(event) => setFilters({ ...filters, type: event.target.value })}
                  >
                    <option value="all">Todos</option>
                    {TIMELINE_EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {TIMELINE_EVENT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </Select>
                </FilterField>
                <FilterField id="timeline-period" label="Período">
                  <Select
                    id="timeline-period"
                    value={filters.period}
                    onChange={(event) => setFilters({ ...filters, period: event.target.value as Period })}
                  >
                    {PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {PERIOD_LABELS[period]}
                      </option>
                    ))}
                  </Select>
                </FilterField>
              </>
            )}
          </div>

          {isSearching ? (
            <>
              {searchQuery.isLoading && <SkeletonList label="Buscando…" />}
              {searchQuery.isError && (
                <InlineError onRetry={() => void searchQuery.refetch().then(() => focusListTitleIfLost())}>
                  Não foi possível buscar agora. O histórico continua como estava.
                </InlineError>
              )}
              {searchQuery.isSuccess && searchEntries.length === 0 && (
                <NoResults
                  message={`Nada encontrado para “${debouncedSearch.trim()}”.`}
                  detail="A busca procura em gastos, manutenções, problemas, projetos, documentos e notas. Abastecimentos não entram."
                  clearLabel="Limpar busca"
                  onClear={() => {
                    setSearchInput("");
                    setDebouncedSearch("");
                    document.getElementById("timeline-search")?.focus();
                  }}
                />
              )}
              {searchQuery.isSuccess && searchEntries.length > 0 && (
                <>
                  {columns}
                  <ol className="divide-y divide-border">{renderRows(searchEntries, false)}</ol>
                </>
              )}
            </>
          ) : (
            <>
              {timelineQuery.isLoading && <SkeletonList label="Carregando histórico…" />}
              {timelineQuery.isError && (
                // Deu certo, o botão some: o foco vai ao título da lista em vez de cair no `<body>`.
                <InlineError onRetry={() => void timelineQuery.refetch().then(() => focusListTitleIfLost())}>
                  Não foi possível carregar o histórico. A busca continua disponível.
                </InlineError>
              )}
              {listReady && events.length > 0 && filteredEvents.length === 0 && (
                <NoResults
                  message="Nenhum registro com estes filtros."
                  detail={
                    <>
                      Seleção atual: {selectionLabel}. Há {formatCount(outside)}{" "}
                      {outside === 1 ? "registro" : "registros"} fora dela.
                    </>
                  }
                  onClear={() => setFilters({ type: "all", period: "all" })}
                />
              )}
              {listReady && filteredEvents.length > 0 && (
                <>
                  {columns}
                  <ol aria-label="Registros por mês">
                    {months.map((group, index) => (
                      <li key={group.month} className={cn(index > 0 && "border-t border-border")}>
                        {/* Separador discreto do mês: sobrelinha e a contagem do mês, sem caixa. */}
                        <div className="flex items-baseline justify-between gap-3 border-b border-hairline px-(--panel-pad-x) pt-4 pb-2">
                          <h3 className="type-overline text-text-secondary">{group.label}</h3>
                          <p className="type-caption text-text-secondary tabular-nums">
                            {formatCount(group.entries.length)} {group.entries.length === 1 ? "registro" : "registros"}
                          </p>
                        </div>
                        <ol className="divide-y divide-border">{renderRows(group.entries, true)}</ol>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </>
          )}
        </section>
      )}

      <CreateNoteDialog
        vehicleId={vehicle.id}
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          // Aberto pelo `?novo=1` ou pelo estado vazio: não há gatilho pra onde voltar.
          if (!open) focusListTitleIfLost();
        }}
        onCreated={() => setAnnouncement("Nota salva no histórico.")}
      />
      {editing && (
        <EditNoteDialog
          key={editing.note.id}
          vehicleId={vehicle.id}
          note={notesById.get(editing.note.id) ?? editing.note}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) restoreFocus(editing.trigger);
          }}
          onSaved={() => setAnnouncement("Nota atualizada.")}
        />
      )}
      {deleting && (
        <DeleteNoteDialog
          key={deleting.note.id}
          vehicleId={vehicle.id}
          note={deleting.note}
          open={deleteOpen}
          onDeleted={() => {
            deletedRef.current = true;
            setAnnouncement("Nota excluída.");
          }}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (open) return;
            if (deletedRef.current) focusListTitleIfLost(deleting.trigger);
            else restoreFocus(deleting.trigger);
          }}
        />
      )}
    </Page>
  );
}
