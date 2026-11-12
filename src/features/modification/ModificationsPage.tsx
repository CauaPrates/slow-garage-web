import { useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ActionLabel, Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, NoResults, PageError } from "@/components/ui/feedback";
import { FilterField } from "@/components/ui/form";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import type { SummaryState } from "@/components/ui/summary-strip";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { useExpenses, type ExpenseWithAttachment } from "@/features/expense/useExpenses";
import { CreateExpenseDialog } from "@/features/expense/CreateExpenseDialog";
import { EditExpenseDialog } from "@/features/expense/EditExpenseDialog";
import { DeleteExpenseDialog } from "@/features/expense/DeleteExpenseDialog";
import { useVehicleDashboard } from "@/features/dashboard/useVehicleDashboard";
import { formatCount, formatDateOnly, formatMoney } from "@/lib/format";
import { PERIODS, PERIOD_LABELS, periodRange, type Period } from "@/lib/period";
import { cn } from "@/lib/utils";
import { MODIFICATION_ROW_GRID, ModificationRow } from "./ModificationRow";
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { ModificationMonthly, ModificationSummary } from "./ModificationOverview";

const LIST_TITLE_ID = "modifications-list-title";

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

function listState(query: { isError: boolean; isSuccess: boolean }): SummaryState {
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
      <Page aria-busy="true">
        <span className="sr-only">Carregando modificações…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="h-64 rounded-lg border border-border bg-surface" />
      </Page>
    );
  }
  if (vehicleQuery.isError || categoriesQuery.isError) {
    return (
      <PageError
        message="Não foi possível carregar as modificações."
        onRetry={() => {
          void vehicleQuery.refetch();
          void categoriesQuery.refetch();
        }}
      />
    );
  }
  if (!vehicleQuery.vehicle) {
    return <VehicleNotFound />;
  }
  if (!category) {
    return (
      <PageError
        message="A categoria de upgrades não está disponível."
        onRetry={() => void categoriesQuery.refetch()}
      />
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
    <Page>
      <Breadcrumb items={[{ label: "Modificações" }]} />

      <PageHeader
        title="Modificações"
        description={
          <>
            {/* Última palavra e "i" juntos: no celular o botão não cai sozinho na linha de baixo. */}
            Upgrades deste veículo, lançados como{" "}
            <span className="whitespace-nowrap">
              gasto.
              <InfoTip label="O que entra em Modificações" className="-my-3 -ml-1">
                <p>
                  Os gastos da categoria Upgrade — os mesmos de Gastos, inclusive os lançados por lá. Editar ou
                  excluir aqui muda o mesmo registro.
                </p>
                <p>Itens de projeto ficam em Projetos e não entram nesta lista nem neste total.</p>
              </InfoTip>
            </span>
          </>
        }
        actions={
          !noUpgradesAtAll && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <ActionLabel short="Registrar" rest="upgrade" />
            </Button>
          )
        }
      />

      {noUpgradesAtAll ? (
        <EmptyState
          icon={Sparkles}
          titleId={LIST_TITLE_ID}
          title="Nenhuma modificação registrada neste veículo."
          action={<Button onClick={() => setOpen(true)}>Registrar primeiro upgrade</Button>}
        >
          Peça, acerto ou upgrade: cada registro entra como gasto na categoria Upgrade, e quem já foi lançado assim
          em Gastos aparece aqui. Só o valor é obrigatório.
        </EmptyState>
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
              <PanelHeader
                title="Registros"
                titleId={LIST_TITLE_ID}
                action={
                  <PanelCount>
                    {listReady && (
                      <>
                        {formatCount(visible.length)} {visible.length === 1 ? "registro" : "registros"} ·{" "}
                        <span className="type-value text-sm text-text-primary">{formatMoney(selectionTotal)}</span>{" "}
                        nesta seleção
                      </>
                    )}
                  </PanelCount>
                }
              />

              {/*
                Abaixo de 400px os três empilham: lado a lado, "Mais recentes" (360) e "Mês passado" (390)
                não cabiam inteiros no seletor. De 400 até `sm`: busca em cima e os dois seletores lado a lado.
              */}
              <div className="grid grid-cols-1 gap-3 border-b border-border px-(--panel-pad-x) py-(--panel-pad-y) min-[25rem]:grid-cols-2 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
                <FilterField id="upgrade-search" label="Buscar modificação" className="min-[25rem]:col-span-2 sm:col-span-1">
                  <Input
                    id="upgrade-search"
                    type="search"
                    placeholder="Peça, oficina ou anotação"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </FilterField>
                <FilterField id="upgrade-period" label="Período">
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
                </FilterField>
                <FilterField id="upgrade-order" label="Ordenar">
                  <Select id="upgrade-order" value={order} onChange={(event) => setOrder(event.target.value)}>
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="value">Maior valor</option>
                  </Select>
                </FilterField>
              </div>

              {expensesQuery.isLoading && <SkeletonList label="Carregando upgrades…" />}

              {expensesQuery.isError && (
                <InlineError onRetry={() => void expensesQuery.refetch()}>
                  Não foi possível carregar os upgrades. A busca e os filtros continuam como estão.
                </InlineError>
              )}

              {noResults && (
                <NoResults
                  message="Nenhum upgrade encontrado com estes filtros."
                  detail={
                    filtered && (
                      <>
                        Seleção atual: {selectionLabel}. Há {formatCount(upgrades.length)}{" "}
                        {upgrades.length === 1 ? "registro" : "registros"} fora dela.
                      </>
                    )
                  }
                  onClear={clearFilters}
                />
              )}

              {listReady && visible.length > 0 && (
                <>
                  <ListColumns className={MODIFICATION_ROW_GRID}>
                    <span>Modificação</span>
                    <span>Data</span>
                    <span className="text-right">Valor</span>
                    <span />
                  </ListColumns>
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
    </Page>
  );
}
