import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle, Fuel, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateFuelLogDialog } from "./CreateFuelLogDialog";
import { FUEL_ROW_GRID, FuelLogRow } from "./FuelLogRow";
import { FuelSummaryPanel } from "./FuelSummaryPanel";
import { useFuelLogs } from "./useFuelLogs";
import { useVehicleFuelSummary } from "./useVehicleFuelSummary";

const LIST_TITLE_ID = "fuel-list-title";
// Largura toda, como Gastos (etapa 05); em monitor largo quem se ajusta são as colunas da lista (`FUEL_ROW_GRID`).
const PAGE_CLASSNAME = "flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6";

/**
 * Etapa 06: cabeçalho curto com "Registrar abastecimento", resumo de
 * combustível e o histórico. Lista e resumo carregam e falham cada um por
 * conta própria (são consultas separadas, como antes): erro em um não vira
 * "nenhum abastecimento" no outro. As mesmas consultas, chaves e
 * invalidações de antes; `?novo=1` continua abrindo o cadastro.
 */
export function FuelLogsPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(() => searchParams.get("novo") === "1");

  const {
    vehicle,
    isLoading: vehicleLoading,
    isError: vehicleError,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId ?? "");
  const logsQuery = useFuelLogs(vehicleId ?? "");
  const summaryQuery = useVehicleFuelSummary(vehicleId ?? "");

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("novo");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vehicleLoading) {
    return (
      <div className={PAGE_CLASSNAME} aria-busy="true">
        <span className="sr-only">Carregando abastecimentos…</span>
        <div className="h-14 w-56 animate-pulse rounded-md bg-surface" aria-hidden="true" />
        <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" aria-hidden="true" />
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
        <p className="text-sm text-text-secondary">Não foi possível carregar os abastecimentos.</p>
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

  const logs = logsQuery.data ?? [];
  const ready = logsQuery.isSuccess;
  const noLogsAtAll = ready && logs.length === 0;

  return (
    <div className={PAGE_CLASSNAME}>
      <Breadcrumb items={[{ label: "Abastecimentos" }]} />

      <header className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Abastecimentos</h1>
          <p className="text-sm text-text-secondary">Litros, valores e consumo deste veículo.</p>
        </div>
        {!noLogsAtAll && (
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {/* Um nó de texto só: com dois itens, o `gap` do botão somava um espaço a mais antes de "abastecimento". */}
            <span>
              Registrar<span className="sr-only sm:not-sr-only"> abastecimento</span>
            </span>
          </Button>
        )}
      </header>

      {/* Sem nenhum registro, o resumo seria só traços: o estado vazio explica e oferece o cadastro. */}
      {!noLogsAtAll && (
        <FuelSummaryPanel
          summary={
            summaryQuery.isError
              ? { status: "error", onRetry: () => void summaryQuery.refetch() }
              : summaryQuery.isSuccess
                ? { status: "ready", data: summaryQuery.data }
                : { status: "loading" }
          }
          financial={vehicle.financialSummary}
        />
      )}

      {noLogsAtAll ? (
        <section
          aria-labelledby={LIST_TITLE_ID}
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-12 text-center"
        >
          <Fuel className="h-6 w-6 text-text-secondary" aria-hidden="true" />
          <h2 id={LIST_TITLE_ID} className="font-medium text-text-primary">
            Nenhum abastecimento registrado neste veículo.
          </h2>
          <p className="max-w-md text-sm text-text-secondary">
            Litros e valor bastam pra registrar. Com a quilometragem e dois tanques cheios seguidos, o consumo
            passa a aparecer.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-1">
            Registrar primeiro abastecimento
          </Button>
        </section>
      ) : (
        <section aria-labelledby={LIST_TITLE_ID} className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
            <h2 id={LIST_TITLE_ID} className="text-sm font-medium text-text-primary">
              Histórico
            </h2>
            <p aria-live="polite" className="text-xs text-text-secondary">
              {ready && `${formatCount(logs.length)} ${logs.length === 1 ? "abastecimento" : "abastecimentos"}`}
            </p>
          </div>

          {logsQuery.isLoading && (
            <div className="flex flex-col gap-2 p-4" aria-busy="true">
              <span className="sr-only">Carregando abastecimentos…</span>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-state-hover" aria-hidden="true" />
              ))}
            </div>
          )}

          {logsQuery.isError && (
            <div role="alert" className="flex flex-col items-start gap-2 p-4">
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
                Não foi possível carregar o histórico de abastecimentos.
              </p>
              <Button variant="outline" onClick={() => logsQuery.refetch()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {ready && logs.length > 0 && (
            <>
              <div
                aria-hidden="true"
                className={cn("hidden border-b border-border px-4 py-2 text-xs text-text-secondary md:grid", FUEL_ROW_GRID)}
              >
                <span>Abastecimento</span>
                <span className="text-right">Odômetro</span>
                <span className="text-right">Litros</span>
                <span className="text-right">Valor</span>
                <span className="text-right">Preço/L</span>
                <span className="text-right">Consumo</span>
                <span />
              </div>
              <ul className="divide-y divide-border">
                {logs.map((log) => (
                  <FuelLogRow key={log.id} vehicleId={vehicle.id} log={log} listTitleId={LIST_TITLE_ID} />
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <CreateFuelLogDialog
        vehicleId={vehicle.id}
        defaultFuelType={vehicle.fuel_type}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
