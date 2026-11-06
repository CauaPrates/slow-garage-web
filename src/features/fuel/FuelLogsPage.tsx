import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Fuel, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ActionLabel, Page, PageHeader } from "@/components/layout/Page";
import { VehicleNotFound } from "@/components/shared/VehicleNotFound";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineError, PageError } from "@/components/ui/feedback";
import { ListColumns, PANEL_CLASSNAME, PanelCount, PanelHeader } from "@/components/ui/panel";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { CreateFuelLogDialog } from "./CreateFuelLogDialog";
import { FUEL_ROW_GRID, FuelLogRow } from "./FuelLogRow";
import { FuelSummaryPanel } from "./FuelSummaryPanel";
import { useFuelLogs } from "./useFuelLogs";
import { useVehicleFuelSummary } from "./useVehicleFuelSummary";

const LIST_TITLE_ID = "fuel-list-title";

/**
 * Etapa 06: cabeçalho curto com "Registrar abastecimento", resumo de
 * combustível e o histórico. Lista e resumo carregam e falham cada um por
 * conta própria (são consultas separadas, como antes): erro em um não vira
 * "nenhum abastecimento" no outro. As mesmas consultas, chaves e
 * invalidações de antes; `?novo=1` continua abrindo o cadastro.
 *
 * Harmonização 01: cabeçalho, painel, estados e colunas pelos componentes
 * comuns (`Page`, `PageHeader`, `PanelHeader`, `EmptyState`, `InlineError`).
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
      <Page aria-busy="true">
        <span className="sr-only">Carregando abastecimentos…</span>
        <Skeleton className="h-14 w-56 bg-surface" />
        <Skeleton className="h-40 rounded-lg border border-border bg-surface" />
        <Skeleton className="h-64 rounded-lg border border-border bg-surface" />
      </Page>
    );
  }

  if (vehicleError) {
    return <PageError message="Não foi possível carregar os abastecimentos." onRetry={() => void refetchVehicle()} />;
  }

  if (!vehicle) {
    return <VehicleNotFound />;
  }

  const logs = logsQuery.data ?? [];
  const ready = logsQuery.isSuccess;
  const noLogsAtAll = ready && logs.length === 0;

  return (
    <Page>
      <Breadcrumb items={[{ label: "Abastecimentos" }]} />

      <PageHeader
        title="Abastecimentos"
        description="Litros, valores e consumo deste veículo."
        actions={
          !noLogsAtAll && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <ActionLabel short="Registrar" rest="abastecimento" />
            </Button>
          )
        }
      />

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
        <EmptyState
          icon={Fuel}
          titleId={LIST_TITLE_ID}
          title="Nenhum abastecimento registrado neste veículo."
          action={<Button onClick={() => setCreateOpen(true)}>Registrar primeiro abastecimento</Button>}
        >
          Litros e valor bastam pra registrar. Com a quilometragem e dois tanques cheios seguidos, o consumo passa a
          aparecer.
        </EmptyState>
      ) : (
        <section aria-labelledby={LIST_TITLE_ID} className={PANEL_CLASSNAME}>
          <PanelHeader
            title="Histórico"
            titleId={LIST_TITLE_ID}
            action={
              <PanelCount>
                {ready && `${formatCount(logs.length)} ${logs.length === 1 ? "abastecimento" : "abastecimentos"}`}
              </PanelCount>
            }
          />

          {logsQuery.isLoading && <SkeletonList label="Carregando abastecimentos…" />}

          {logsQuery.isError && (
            <InlineError onRetry={() => void logsQuery.refetch()}>
              Não foi possível carregar o histórico de abastecimentos.
            </InlineError>
          )}

          {ready && logs.length > 0 && (
            <>
              <ListColumns className={FUEL_ROW_GRID}>
                <span>Abastecimento</span>
                <span className="text-right">Odômetro</span>
                <span className="text-right">Litros</span>
                <span className="text-right">Valor</span>
                <span className="text-right">Preço/L</span>
                <span className="text-right">Consumo</span>
                <span />
              </ListColumns>
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
    </Page>
  );
}
