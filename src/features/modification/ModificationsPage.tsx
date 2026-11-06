import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, Info, Plus, Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { useExpenses, type ExpenseWithAttachment } from "@/features/expense/useExpenses";
import { CreateExpenseDialog } from "@/features/expense/CreateExpenseDialog";
import { EditExpenseDialog } from "@/features/expense/EditExpenseDialog";
import { DeleteExpenseDialog } from "@/features/expense/DeleteExpenseDialog";
import { useVehicleDashboard } from "@/features/dashboard/useVehicleDashboard";
import { formatCount, formatDateOnly, formatMoney } from "@/lib/format";
import { PERIODS, PERIOD_LABELS, periodRange, type Period } from "@/lib/period";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { MODIFICATION_ROW_GRID, ModificationRow } from "./ModificationRow";
import { ModificationMonthly, ModificationSummary, type StatState } from "./ModificationOverview";

const LIST_TITLE_ID = "modifications-list-title";
// Largura toda, como as outras telas redesenhadas; em monitor largo quem se ajusta são as colunas.
const PAGE_CLASSNAME = "flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6";
const PANEL_CLASSNAME = "overflow-hidden rounded-lg border border-border bg-surface";

/** Espera o diálogo sair e, se o foco caiu no `<body>` (o gatilho sumiu), leva ao título da lista. */
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

function listState(query: { isError: boolean; isSuccess: boolean }): StatState {
  if (query.isError) return "error";
  return query.isSuccess ? "ready" : "loading";
}

export function ModificationsPage() {
  const { vehicleId = "" } = useParams<{ vehicleId: string }>();
  // Changing vehicles remounts the workspace, including its filters and dialogs.
  return <ModificationWorkspace key={vehicleId} vehicleId={vehicleId} />;
}

/**
 * Etapa 10: Modificações são os gastos da categoria de sistema Upgrade — a
 * mesma tabela, consulta, chaves e diálogos de Gastos, com a categoria
 * gravada por quem chama (`upgradeCategoryId`). Itens de projeto são outra
 * tabela e não entram aqui.
 *
 * Cabeçalho compacto → resumo (total e contagem da view por categoria, via
 * RPC do dashboard; último registro da lista) → registros, com a busca, o
 * período e a ordem de antes (todos no cliente) → upgrades por mês (a soma
 * por mês que a página já fazia), ao lado da lista a partir de `xl`. O
 * resumo e a lista carregam e falham cada um por si. `?novo=1` abre o
 * cadastro como antes.
 */
function ModificationWorkspace({ vehicleId }: { vehicleId: string }) {
  const [params, setParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const open = dialogOpen || params.get("novo") === "1";
  function setOpen(value: boolean) {
    setDialogOpen(value);
    if (!value && params.has("novo")) {
      const next = new URLSearchParams(params);
      next.delete("novo");
      setParams(next, { replace: true });
    }
  }
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [order, setOrder] = useState("recent");
  // O registro aberto fica aqui, não na linha: editado, ele pode sair da busca e desmontar a linha.
  const [editing, setEditing] = useState<ExpenseWithAttachment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<ExpenseWithAttachment | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const deletedRef = useRef(false);

  const vehicleQuery = useVehicle(vehicleId);
  const categoriesQuery = useExpenseCategories();
  const category = categoriesQuery.data?.find((item) => item.slug === "upgrade" && item.user_id === null);
  const expensesQuery = useExpenses(vehicleId, { categoryId: category?.id ?? "all", period: "all" }, !!category);
  // Total e contagem vêm de `vehicle_expenses_by_category` (via dashboard) — nunca somados aqui.
  const dashboardQuery = useVehicleDashboard(vehicleId);

  if (vehicleQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando modificações…</span>
        <div className="h-14 w-56 animate-pulse rounded-md bg-surface" aria-hidden="true" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
      </div>
    );
  }
  if (vehicleQuery.isError || categoriesQuery.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar as modificações.</p>
        <Button
          variant="ghost"
          onClick={() => {
            void vehicleQuery.refetch();
            void categoriesQuery.refetch();
          }}
        >
          Tentar de novo
        </Button>
      </div>
    );
  }
  if (!vehicleQuery.vehicle) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-text-primary">Veículo não encontrado.</p>
        <Link to={ROUTES.home} className="text-sm text-accent underline">
          Voltar para a garagem
        </Link>
      </div>
    );
  }
  if (!category) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">A categoria de upgrades não está disponível.</p>
        <Button variant="ghost" onClick={() => void categoriesQuery.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const categories = categoriesQuery.data ?? [];
  const upgrades = expensesQuery.data ?? [];
  const listReady = expensesQuery.isSuccess;
  const noUpgradesAtAll = listReady && upgrades.length === 0;

  // A view agrupa por slug + label; sem linha = nenhum upgrade registrado.
  const summary = dashboardQuery.data?.expenses_by_category.find(
    (row) => row.category_slug === category.slug && row.category_label === category.label,
  );
  const total = summary?.total_amount ?? 0;
  const count = summary?.expense_count ?? 0;

  const range = periodRange(period);
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const visible = upgrades
    .filter((item) => {
      if (range.gte && (!item.occurred_on || item.occurred_on < range.gte)) return false;
      if (range.lte && (!item.occurred_on || item.occurred_on > range.lte)) return false;
      return [item.description, item.vendor, item.notes].some((value) =>
        (value ?? "").toLocaleLowerCase("pt-BR").includes(term),
      );
    })
    .sort((a, b) =>
      order === "value"
        ? b.amount - a.amount
        : order === "oldest"
          ? a.occurred_on.localeCompare(b.occurred_on)
          : b.occurred_on.localeCompare(a.occurred_on),
    );
  const selectionTotal = visible.reduce((sum, item) => sum + item.amount, 0);
  const dated = upgrades
    .filter((item) => item.occurred_on)
    .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
  const months = new Map<string, number>();
  for (const item of dated) {
    const month = item.occurred_on.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + item.amount);
  }
  const monthly = [...months].sort(([a], [b]) => a.localeCompare(b)).slice(-6);

  const filtered = term !== "" || period !== "all";
  const noResults = listReady && upgrades.length > 0 && visible.length === 0;
  const selectionLabel = [term && `busca “${search.trim()}”`, period !== "all" && PERIOD_LABELS[period]]
    .filter(Boolean)
    .join(" · ");
  const showMonthly = listReady && monthly.length > 0;

  // O editado/excluído sempre na versão mais recente da lista (o anexo muda com o diálogo aberto).
  const editingUpgrade = editing ? (upgrades.find((u) => u.id === editing.id) ?? editing) : null;
  const deletingUpgrade = deleting ? (upgrades.find((u) => u.id === deleting.id) ?? deleting) : null;

  function clearFilters() {
    setSearch("");
    setPeriod("all");
  }

  function restoreFocus() {
    const trigger = triggerRef.current;
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
      else focusListTitleIfLost();
    });
  }

  return (
    <div className={PAGE_CLASSNAME}>
      <Breadcrumb items={[{ label: "Modificações" }]} />

      <header className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight text-text-primary uppercase sm:text-3xl">
            Modificações
          </h1>
          <p className="text-sm text-text-secondary">
            {/* Última palavra e "i" juntos: no celular o botão não cai sozinho na linha de baixo. */}
            Upgrades deste veículo, lançados como{" "}
            <span className="whitespace-nowrap">
              gasto.
              <Popover>
                <PopoverTrigger
                  aria-label="O que entra em Modificações"
                  className="-my-3 -ml-1 inline-flex h-11 w-11 items-center justify-center rounded-md align-middle text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary data-[state=open]:bg-state-active data-[state=open]:text-text-primary"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  aria-label="O que entra em Modificações"
                  className="flex w-72 flex-col gap-2 text-sm text-text-secondary"
                >
                  <p>
                    Os gastos da categoria Upgrade — os mesmos de Gastos, inclusive os lançados por lá. Editar ou
                    excluir aqui muda o mesmo registro.
                  </p>
                  <p>Itens de projeto ficam em Projetos e não entram nesta lista nem neste total.</p>
                </PopoverContent>
              </Popover>
            </span>
          </p>
        </div>
        {!noUpgradesAtAll && (
          <Button onClick={() => setOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {/* Um nó de texto só: no celular "Registrar", nome completo pro leitor de tela. */}
            <span>
              Registrar<span className="sr-only sm:not-sr-only"> upgrade</span>
            </span>
          </Button>
        )}
      </header>

      {noUpgradesAtAll ? (
        <section
          aria-labelledby={LIST_TITLE_ID}
          className={cn(PANEL_CLASSNAME, "flex flex-col items-center gap-3 px-6 py-12 text-center")}
        >
          <Sparkles className="h-6 w-6 text-text-secondary" aria-hidden="true" />
          <h2 id={LIST_TITLE_ID} className="font-medium text-text-primary">
            Nenhuma modificação registrada neste veículo.
          </h2>
          <p className="max-w-md text-sm text-text-secondary">
            Peça, acerto ou upgrade: cada registro entra como gasto na categoria Upgrade, e quem já foi lançado
            assim em Gastos aparece aqui. Só o valor é obrigatório.
          </p>
          <Button onClick={() => setOpen(true)} className="mt-1">
            Registrar primeiro upgrade
          </Button>
        </section>
      ) : (
        <>
          <ModificationSummary
            total={formatMoney(total)}
            count={formatCount(count)}
            countText={`${formatCount(count)} ${count === 1 ? "registro" : "registros"}`}
            lastDate={dated[0] ? formatDateOnly(dated[0].occurred_on) : "—"}
            summaryState={listState(dashboardQuery)}
            listState={listState(expensesQuery)}
            onRetrySummary={() => void dashboardQuery.refetch()}
          />

          <div className={cn("grid gap-6", showMonthly && "xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start")}>
            <section aria-labelledby={LIST_TITLE_ID} className={PANEL_CLASSNAME}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
                <h2 id={LIST_TITLE_ID} className="text-sm font-medium text-text-primary">
                  Registros
                </h2>
                <p aria-live="polite" className="text-xs text-text-secondary">
                  {listReady && (
                    <>
                      {formatCount(visible.length)} {visible.length === 1 ? "registro" : "registros"} ·{" "}
                      <span className="text-sm text-text-primary tabular-nums">{formatMoney(selectionTotal)}</span>{" "}
                      nesta seleção
                    </>
                  )}
                </p>
              </div>

              {/*
                Abaixo de 400px os três empilham: lado a lado, "Mais recentes" (360) e "Mês passado" (390)
                não cabiam inteiros no seletor. De 400 até `sm`: busca em cima e os dois seletores lado a lado.
              */}
              <div className="grid grid-cols-1 gap-3 border-b border-border px-4 py-3 min-[25rem]:grid-cols-2 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
                <div className="flex min-w-0 flex-col gap-1.5 min-[25rem]:col-span-2 sm:col-span-1">
                  <Label htmlFor="upgrade-search">Buscar modificação</Label>
                  <Input
                    id="upgrade-search"
                    type="search"
                    placeholder="Peça, oficina ou anotação"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor="upgrade-period">Período</Label>
                  <Select
                    id="upgrade-period"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value as Period)}
                  >
                    {PERIODS.map((value) => (
                      <option key={value} value={value}>
                        {PERIOD_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor="upgrade-order">Ordenar</Label>
                  <Select id="upgrade-order" value={order} onChange={(event) => setOrder(event.target.value)}>
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="value">Maior valor</option>
                  </Select>
                </div>
              </div>

              {expensesQuery.isLoading && (
                <div className="flex flex-col gap-2 p-4" aria-busy="true">
                  <span className="sr-only">Carregando upgrades…</span>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-md bg-state-hover" aria-hidden="true" />
                  ))}
                </div>
              )}

              {expensesQuery.isError && (
                <div role="alert" className="flex flex-col items-start gap-2 p-4">
                  <p className="flex items-center gap-2 text-sm text-text-secondary">
                    <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
                    Não foi possível carregar os upgrades. A busca e os filtros continuam como estão.
                  </p>
                  <Button variant="outline" onClick={() => void expensesQuery.refetch()}>
                    Tentar de novo
                  </Button>
                </div>
              )}

              {noResults && (
                <div className="flex flex-col items-start gap-2 px-4 py-6">
                  <p className="text-sm text-text-primary">Nenhum upgrade encontrado com estes filtros.</p>
                  {filtered && (
                    <p className="text-sm break-words text-text-secondary">
                      Seleção atual: {selectionLabel}. Há {formatCount(upgrades.length)}{" "}
                      {upgrades.length === 1 ? "registro" : "registros"} fora dela.
                    </p>
                  )}
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}

              {listReady && visible.length > 0 && (
                <>
                  <div
                    aria-hidden="true"
                    className={cn(
                      "hidden border-b border-border px-4 py-2 text-xs text-text-secondary md:grid",
                      MODIFICATION_ROW_GRID,
                    )}
                  >
                    <span>Modificação</span>
                    <span>Data</span>
                    <span className="text-right">Valor</span>
                    <span />
                  </div>
                  <ul className="divide-y divide-border">
                    {visible.map((upgrade) => (
                      <ModificationRow
                        key={upgrade.id}
                        upgrade={upgrade}
                        onEdit={(item, trigger) => {
                          triggerRef.current = trigger;
                          setEditing(item);
                          setEditOpen(true);
                        }}
                        onDelete={(item, trigger) => {
                          triggerRef.current = trigger;
                          deletedRef.current = false;
                          setDeleting(item);
                          setDeleteOpen(true);
                        }}
                      />
                    ))}
                  </ul>
                </>
              )}
            </section>

            {showMonthly && <ModificationMonthly months={monthly} className="xl:pt-1" />}
          </div>
        </>
      )}

      <CreateExpenseDialog
        vehicleId={vehicleId}
        categories={categories}
        upgradeCategoryId={category.id}
        defaultOdometerKm={vehicleQuery.vehicle.current_odometer_km ?? undefined}
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          // Aberto pelo estado vazio: o botão some quando o primeiro upgrade entra; o foco vai pra lista.
          if (!value) focusListTitleIfLost();
        }}
      />
      {editingUpgrade && (
        <EditExpenseDialog
          key={editingUpgrade.id}
          vehicleId={vehicleId}
          expense={editingUpgrade}
          upgradeCategoryId={category.id}
          categories={categories}
          open={editOpen}
          onOpenChange={(value) => {
            setEditOpen(value);
            if (!value) restoreFocus();
          }}
        />
      )}
      {deletingUpgrade && (
        <DeleteExpenseDialog
          key={deletingUpgrade.id}
          vehicleId={vehicleId}
          expense={deletingUpgrade}
          categoryLabel={category.label}
          isUpgrade
          upgradeMode
          open={deleteOpen}
          onDeleted={() => {
            deletedRef.current = true;
          }}
          onOpenChange={(value) => {
            setDeleteOpen(value);
            if (value) return;
            if (deletedRef.current) focusListTitleIfLost(triggerRef.current);
            else restoreFocus();
          }}
        />
      )}
    </div>
  );
}
