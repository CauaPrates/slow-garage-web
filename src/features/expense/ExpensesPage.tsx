import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Plus, Receipt } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ActionLabel, Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, NoResults, PageError } from "@/components/ui/feedback";
import { InfoTip } from "@/components/ui/info-tip";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { formatCount, formatMoney } from "@/lib/format";
import { PERIOD_LABELS } from "@/lib/period";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateExpenseDialog } from "./CreateExpenseDialog";
import { ExpenseFilters } from "./ExpenseFilters";
import { EXPENSE_ROW_GRID, ExpenseRow } from "./ExpenseRow";
import { useExpenseCategories } from "./useExpenseCategories";
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
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
      <Page aria-busy="true">
        <span className="sr-only">Carregando gastos…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="h-64 rounded-lg border border-border bg-surface" />
      </Page>
    );
  }

  if (vehicleError || categoriesQuery.isError) {
    return (
      <PageError
        message="Não foi possível carregar os gastos."
        onRetry={() => {
            void refetchVehicle();
            void categoriesQuery.refetch();
          }}
      />
    );
  }

  if (!vehicle) {
    return <VehicleNotFound />;
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
    <Page>
      <Breadcrumb items={[{ label: "Gastos" }]} />

      <PageHeader
        title="Gastos"
        description={
          // Etapa 06: só a frase curta à vista; o resto na ajuda. Última palavra e "i" juntos na quebra.
          <>
            Gastos avulsos deste{" "}
            <span className="whitespace-nowrap">
              veículo.
              <InfoTip label="O que não entra em Gastos" className="-my-3 -ml-1">
                Abastecimento, manutenção e itens de projeto ficam nas próprias telas.
              </InfoTip>
            </span>
          </>
        }
        actions={
          !noExpensesAtAll && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <ActionLabel short="Registrar" rest="gasto" />
            </Button>
          )
        }
      />

      {noExpensesAtAll ? (
        <EmptyState
          icon={Receipt}
          titleId={LIST_TITLE_ID}
          title="Nenhum gasto registrado neste veículo."
          action={<Button onClick={() => setCreateOpen(true)}>Registrar primeiro gasto</Button>}
        >
          Peças, seguro, documentação, estética: registre o primeiro lançamento. Só o valor é obrigatório.
        </EmptyState>
      ) : (
        <section aria-labelledby={LIST_TITLE_ID} className={PANEL_CLASSNAME}>
          <PanelHeader
            title="Lançamentos"
            titleId={LIST_TITLE_ID}
            action={
              <PanelCount>
                {ready && expenses.length > 0 && (
                  <>
                    {formatCount(expenses.length)} {expenses.length === 1 ? "lançamento" : "lançamentos"}
                    {selectionTotal != null ? (
                      <>
                        {" · "}Total da seleção{" "}
                        <span className="type-value text-sm text-text-primary">{formatMoney(selectionTotal)}</span>
                      </>
                    ) : (
                      " — limite da consulta atingido; o total da seleção não é exibido"
                    )}
                  </>
                )}
                {noResults && "Nenhum lançamento nesta seleção"}
              </PanelCount>
            }
          />

          {/*
            Harmonização 01: filtros dentro do painel da lista, sob o título — o lugar que têm em Modificações.
            Sem resultado, "Limpar filtros" fica só na mensagem logo abaixo (um botão, não dois iguais no painel).
          */}
          <ExpenseFilters
            categories={categories}
            value={filters}
            onChange={setFilters}
            onClear={isFiltered && !noResults ? () => setFilters(DEFAULT_FILTERS) : undefined}
            className="border-b border-border px-(--panel-pad-x) py-(--panel-pad-y)"
          />

          {expensesQuery.isLoading && <SkeletonList label="Carregando lançamentos…" />}

          {expensesQuery.isError && (
            <InlineError onRetry={() => void expensesQuery.refetch()}>
              Não foi possível carregar os lançamentos. Os filtros continuam como estão.
            </InlineError>
          )}

          {noResults && (
            <NoResults
              message="Nenhum gasto encontrado com estes filtros."
              detail={<>Seleção atual: {selectionLabel}. Outros lançamentos podem existir fora dela.</>}
              onClear={() => setFilters(DEFAULT_FILTERS)}
            />
          )}

          {ready && expenses.length > 0 && (
            <>
              <ListColumns className={EXPENSE_ROW_GRID}>
                <span>Descrição</span>
                <span>Categoria</span>
                <span>Data</span>
                <span className="text-right">Valor</span>
                <span />
              </ListColumns>
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
    </Page>
  );
}
