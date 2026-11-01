import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle, Plus, Receipt } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { formatCount, formatMoney } from "@/lib/format";
import { PERIOD_LABELS } from "@/lib/period";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateExpenseDialog } from "./CreateExpenseDialog";
import { ExpenseFilters } from "./ExpenseFilters";
import { EXPENSE_ROW_GRID, ExpenseRow } from "./ExpenseRow";
import { useExpenseCategories } from "./useExpenseCategories";
import { useExpenses, type ExpenseFilters as ExpenseFiltersValue } from "./useExpenses";

const DEFAULT_FILTERS: ExpenseFiltersValue = { categoryId: "all", period: "all" };

/**
 * `max_rows` do PostgREST no projeto (supabase/config.toml do backend). A
 * lista não pagina: com esse tanto de linhas, a resposta pode ter sido
 * cortada, e o total da seleção deixaria de ser a soma de tudo que o filtro
 * pega — então não aparece.
 */
const MAX_ROWS = 1000;

const LIST_TITLE_ID = "expenses-list-title";
// Largura toda, como as outras telas; em monitor largo quem se ajusta são as colunas da lista (`EXPENSE_ROW_GRID`).
const PAGE_CLASSNAME = "flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6";

export function ExpensesPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ExpenseFiltersValue>(DEFAULT_FILTERS);
  const [createOpen, setCreateOpen] = useState(() => searchParams.get("novo") === "1");

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const categoriesQuery = useExpenseCategories();
  const expensesQuery = useExpenses(vehicleId ?? "", filters);

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vehicleLoading || categoriesQuery.isLoading) {
    return (
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando gastos…</span>
        <div className="h-14 w-56 animate-pulse rounded-md bg-surface" aria-hidden="true" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
      </div>
    );
  }

  if (vehicleError || categoriesQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar os gastos.</p>
        <Button
          variant="ghost"
          onClick={() => {
            void refetchVehicle();
            void categoriesQuery.refetch();
          }}
        >
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

  const categories = categoriesQuery.data ?? [];
  const isFiltered = filters.categoryId !== "all" || filters.period !== "all";
  const expenses = expensesQuery.data ?? [];
  const ready = expensesQuery.isSuccess;
  const noExpensesAtAll = ready && !isFiltered && expenses.length === 0;
  const noResults = ready && isFiltered && expenses.length === 0;
  const selectionLabel = [
    filters.categoryId !== "all" && (categories.find((c) => c.id === filters.categoryId)?.label ?? "Categoria"),
    filters.period !== "all" && PERIOD_LABELS[filters.period],
  ]
    .filter(Boolean)
    .join(" · ");

  /*
    "Total da seleção": a soma do que a lista já carregou com este filtro — a
    mesma consulta, sem pedir nada novo ao banco. Não é o gasto do veículo
    (que soma 4 fontes, no resumo financeiro do dashboard), e não aparece se
    a lista pode ter vindo cortada.
  */
  const complete = expenses.length < MAX_ROWS;
  const selectionTotal = complete
    ? Math.round(expenses.reduce((sum, expense) => sum + expense.amount, 0) * 100) / 100
    : null;

  return (
    <div className={PAGE_CLASSNAME}>
      <Breadcrumb items={[{ label: "Gastos" }]} />

      <header className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Gastos</h1>
          <p className="text-sm break-words text-text-secondary">
            {/* Modelo que já termina em ponto ("5p Aut.") não ganha outro. */}
            Lançamentos avulsos do {`${vehicle.make} ${vehicle.model}`.replace(/\.+$/, "")}. Abastecimento,
            manutenção e itens de projeto ficam nas próprias telas.
          </p>
        </div>
        {!noExpensesAtAll && (
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {/* Um nó de texto só: com dois itens, o `gap` do botão somava um espaço a mais antes de "gasto". */}
            <span>
              Registrar<span className="sr-only sm:not-sr-only"> gasto</span>
            </span>
          </Button>
        )}
      </header>

      {!noExpensesAtAll && (
        <ExpenseFilters
          categories={categories}
          value={filters}
          onChange={setFilters}
          onClear={isFiltered ? () => setFilters(DEFAULT_FILTERS) : undefined}
        />
      )}

      {noExpensesAtAll ? (
        <section
          aria-labelledby={LIST_TITLE_ID}
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-12 text-center"
        >
          <Receipt className="h-6 w-6 text-text-secondary" aria-hidden="true" />
          <h2 id={LIST_TITLE_ID} className="font-medium text-text-primary">
            Nenhum gasto registrado neste veículo.
          </h2>
          <p className="max-w-md text-sm text-text-secondary">
            Peças, seguro, documentação, estética: registre o primeiro lançamento. Só o valor é obrigatório.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-1">
            Registrar primeiro gasto
          </Button>
        </section>
      ) : (
        <section aria-labelledby={LIST_TITLE_ID} className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
            <h2 id={LIST_TITLE_ID} className="text-sm font-medium text-text-primary">
              Lançamentos
            </h2>
            <p aria-live="polite" className="text-xs text-text-secondary">
              {ready && expenses.length > 0 && (
                <>
                  {formatCount(expenses.length)} {expenses.length === 1 ? "lançamento" : "lançamentos"}
                  {selectionTotal != null ? (
                    <>
                      {" · "}Total da seleção{" "}
                      <span className="font-mono text-sm text-text-primary">{formatMoney(selectionTotal)}</span>
                    </>
                  ) : (
                    " — limite da consulta atingido; o total da seleção não é exibido"
                  )}
                </>
              )}
              {noResults && "Nenhum lançamento nesta seleção"}
            </p>
          </div>

          {expensesQuery.isLoading && (
            <div className="flex flex-col gap-2 p-4" aria-busy="true">
              <span className="sr-only">Carregando lançamentos…</span>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-state-hover" aria-hidden="true" />
              ))}
            </div>
          )}

          {expensesQuery.isError && (
            <div role="alert" className="flex flex-col items-start gap-2 p-4">
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
                Não foi possível carregar os lançamentos. Os filtros continuam como estão.
              </p>
              <Button variant="outline" onClick={() => expensesQuery.refetch()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {noResults && (
            <div className="flex flex-col items-start gap-2 px-4 py-6">
              <p className="text-sm text-text-primary">Nenhum gasto encontrado com estes filtros.</p>
              <p className="text-sm text-text-secondary">
                Seleção atual: {selectionLabel}. Outros lançamentos podem existir fora dela.
              </p>
              <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Limpar filtros
              </Button>
            </div>
          )}

          {ready && expenses.length > 0 && (
            <>
              <div
                aria-hidden="true"
                className={cn(
                  "hidden border-b border-border px-4 py-2 text-xs text-text-secondary md:grid",
                  EXPENSE_ROW_GRID,
                )}
              >
                <span>Descrição</span>
                <span>Categoria</span>
                <span>Data</span>
                <span className="text-right">Valor</span>
                <span />
              </div>
              <ul className="divide-y divide-border">
                {expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    vehicleId={vehicle.id}
                    expense={expense}
                    categories={categories}
                    listTitleId={LIST_TITLE_ID}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <CreateExpenseDialog
        vehicleId={vehicle.id}
        categories={categories}
        defaultOdometerKm={vehicle.current_odometer_km ?? undefined}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
