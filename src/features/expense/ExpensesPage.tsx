import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateExpenseDialog } from "./CreateExpenseDialog";
import { ExpenseFilters } from "./ExpenseFilters";
import { ExpenseListItem } from "./ExpenseListItem";
import { useExpenseCategories } from "./useExpenseCategories";
import { useExpenses, type ExpenseFilters as ExpenseFiltersValue } from "./useExpenses";

const DEFAULT_FILTERS: ExpenseFiltersValue = { categoryId: "all", period: "all" };

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
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 w-40 animate-pulse rounded-md bg-surface" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Gastos</h1>
          <p className="text-sm text-text-secondary">
            {vehicle.make} {vehicle.model}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Registrar gasto</Button>
      </div>

      <ExpenseFilters categories={categories} value={filters} onChange={setFilters} />

      {expensesQuery.isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      )}

      {expensesQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
          <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
          <p className="text-sm text-text-secondary">Não foi possível carregar os gastos.</p>
          <Button variant="ghost" onClick={() => expensesQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!expensesQuery.isLoading && !expensesQuery.isError && expenses.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-12 text-center">
          {isFiltered ? (
            <>
              <p className="text-text-primary">Nenhum gasto encontrado com esse filtro.</p>
              <Button variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Limpar filtro
              </Button>
            </>
          ) : (
            <>
              <p className="text-text-primary">Nenhum gasto registrado ainda.</p>
              <Button onClick={() => setCreateOpen(true)}>Registrar primeiro gasto</Button>
            </>
          )}
        </div>
      )}

      <CreateExpenseDialog
        vehicleId={vehicle.id}
        categories={categories}
        defaultOdometerKm={vehicle.current_odometer_km}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {!expensesQuery.isLoading && !expensesQuery.isError && expenses.length > 0 && (
        <div className="flex flex-col gap-3">
          {expenses.map((expense) => (
            <ExpenseListItem
              key={expense.id}
              vehicleId={vehicle.id}
              expense={expense}
              categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}
