import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGarageAlerts } from "./useGarageAlerts";
import { useGarageMaintenance } from "./useGarageMaintenance";
import { GarageComparisonDashboard } from "./GarageComparisonDashboard";
import { GarageSummary } from "./GarageSummary";
import { GarageTile, GarageTileGrid, type GarageTileState } from "./GarageTiles";
import type { VehicleWithSummary } from "./useVehicles";

type GarageOverviewProps = {
  vehicles: VehicleWithSummary[];
};

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function queryState(query: {
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
}): GarageTileState {
  if (query.isLoading) return { status: "loading" };
  if (query.isError) return { status: "error", onRetry: () => void query.refetch() };
  return { status: "ready" };
}

/**
 * Número do resumo da garagem (recalibração visual 01). Mesmo contrato do
 * `GarageTile` — carregando, erro com "Tentar de novo" (nunca vira zero nem
 * "nada pendente"), pronto —, mas sem caixa nem fio por módulo: o número
 * grande em fonte display carrega a hierarquia sozinho. Fica só na Garagem;
 * o `GarageTile` dos outros painéis não mudou.
 */
function GarageStat({
  label,
  value,
  hint,
  state = { status: "ready" },
  text = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  state?: GarageTileState;
  /** Valor em texto (nome de manutenção): fonte de interface, quebra linha, sem o tamanho de número. */
  text?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <dt className="truncate text-xs font-medium text-text-secondary">{label}</dt>
      <dd className="min-w-0">
        {state.status === "loading" && (
          <>
            <span className="sr-only">Carregando…</span>
            <span className="mt-1 block h-6 w-16 animate-pulse rounded-sm bg-state-hover" aria-hidden="true" />
          </>
        )}
        {state.status === "error" && (
          <span className="flex flex-col items-start">
            <span className="text-xs text-error">Não foi possível carregar.</span>
            <button
              type="button"
              onClick={state.onRetry}
              className="-ml-1 flex min-h-11 items-center px-1 text-xs font-medium text-text-primary underline decoration-border-strong underline-offset-4 hover:decoration-text-primary"
            >
              Tentar de novo
            </button>
          </span>
        )}
        {state.status === "ready" && (
          <>
            <span
              className={cn(
                "block text-text-primary",
                text
                  ? "line-clamp-2 text-[0.9375rem] leading-snug font-semibold break-words"
                  : "truncate font-display text-xl leading-tight font-bold tabular-nums tracking-tight lg:text-[1.75rem]",
              )}
              title={typeof value === "string" ? value : undefined}
            >
              {value}
            </span>
            {hint && (
              <span className="block truncate text-xs text-text-secondary" title={hint}>
                {hint}
              </span>
            )}
          </>
        )}
      </dd>
    </div>
  );
}

/** Mesmas consultas e contas da etapa 02 — só a apresentação mudou. */
function useGarageOverviewData(vehicles: VehicleWithSummary[]) {
  const vehicleIds = vehicles.map((v) => v.id);
  const alertsQuery = useGarageAlerts(vehicleIds);
  const maintenanceQuery = useGarageMaintenance(vehicleIds);
  const isGarage = vehicles.length >= 2;

  const vehicleLabelById = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model}`]));

  const withSummary = vehicles.filter((v) => v.financialSummary != null);
  const monthSpend = vehicles.reduce(
    (sum, v) => sum + (v.financialSummary?.current_month_spend ?? 0),
    0,
  );
  const missingSummary = vehicles.length - withSummary.length;

  const alerts = alertsQuery.data ?? [];
  const overdueCount = alerts.filter((a) => a.severity === "critical").length;
  const alertsHint =
    alerts.length === 0
      ? "nada vencendo"
      : overdueCount > 0
        ? plural(overdueCount, "vencida", "vencidas")
        : "nenhuma vencida";

  const nextService = maintenanceQuery.data?.[0] ?? null;
  const nextServiceVehicle = nextService && isGarage ? vehicleLabelById.get(nextService.vehicle_id) : undefined;
  const nextServiceDate = nextService ? formatDateOnly(nextService.next_service_date) : undefined;

  return {
    isGarage,
    alertsQuery,
    maintenanceQuery,
    withSummary,
    monthSpend,
    missingSummary,
    alerts,
    alertsHint,
    nextService,
    nextServiceVehicle,
    nextServiceDate,
  };
}

/**
 * Resumo curto do topo da garagem (recalibração visual 01). Só o que ajuda a
 * escolher por onde começar: com 2+ veículos, quantos são, o gasto do mês
 * corrente (soma de `current_month_spend`) e as pendências; a próxima
 * manutenção entra a partir de `lg`. Com 1 veículo, só pendências e próxima
 * manutenção — o resto já está no card (ADR-051).
 *
 * Saiu daqui (e não se perdeu): "1 ativo" (o status está em cada card), "em N
 * veículos" (o sino lista por veículo) e o "mês atual" repetido embaixo de
 * "Gasto no mês". Totais, gráficos e comparativo moram em `GarageDetails`,
 * depois da grade.
 */
export function GarageOverview({ vehicles, className }: GarageOverviewProps & { className?: string }) {
  const titleId = useId();
  const d = useGarageOverviewData(vehicles);

  const nextServiceStat = (extra?: string) => (
    <GarageStat
      label="Próxima manutenção"
      value={d.nextService?.name ?? "Nenhuma prevista"}
      hint={d.nextService ? [d.nextServiceDate, d.nextServiceVehicle].filter(Boolean).join(" · ") : undefined}
      state={queryState(d.maintenanceQuery)}
      text
      className={extra}
    />
  );

  return (
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className="sr-only">
        Resumo da garagem
      </h2>
      <dl
        className={cn(
          "grid gap-x-5 gap-y-4 rounded-lg bg-surface px-4 py-3.5 sm:px-5 sm:py-4",
          d.isGarage
            ? // Celular: valor em reais com mais largura; a partir de `lg`, 2×2 ao lado do título (xl) ou 4 em linha.
              "grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2"
            : "grid-cols-2",
        )}
      >
        {d.isGarage && (
          <>
            <GarageStat label="Veículos" value={vehicles.length} />
            <GarageStat
              label="Gasto no mês"
              value={d.withSummary.length > 0 ? formatMoney(d.monthSpend) : "—"}
              hint={d.missingSummary > 0 ? `sem dado de ${plural(d.missingSummary, "veículo", "veículos")}` : undefined}
            />
          </>
        )}
        <GarageStat
          label="Pendências"
          value={d.alerts.length}
          hint={d.alertsHint}
          state={queryState(d.alertsQuery)}
        />
        {/* Com 2+ veículos, abaixo de `lg` a próxima manutenção mora nos detalhes (a faixa do celular é curta). */}
        {nextServiceStat(d.isGarage ? "hidden lg:flex" : undefined)}
      </dl>
    </section>
  );
}

/**
 * Detalhes da garagem (recalibração visual 01): a mesma área recolhida da
 * etapa 02 — resumo financeiro, gráficos e comparativo, sem mudar conta
 * nenhuma —, agora depois da grade de veículos. O gatilho é o próprio título
 * da seção (`h2 > button`, `aria-expanded` + `aria-controls`), recolhido por
 * padrão em qualquer largura. Abaixo de `lg` a próxima manutenção abre aqui,
 * com veículo e data por extenso.
 */
export function GarageDetails({ vehicles }: GarageOverviewProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const d = useGarageOverviewData(vehicles);

  if (!d.isGarage) return null;

  const nextServiceHint = d.nextService
    ? [d.nextServiceVehicle, d.nextServiceDate].filter(Boolean).join(" · ")
    : undefined;

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-2">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-md px-2 text-left transition-colors duration-(--duration-fast) hover:bg-state-hover"
        >
          <span className="flex min-w-0 flex-col">
            <span className="font-display text-lg leading-tight font-bold tracking-tight text-text-primary">
              Detalhes da garagem
            </span>
            <span className="text-sm text-text-secondary">
              <span className="lg:hidden">Próxima manutenção, totais, gráficos e comparativo</span>
              <span className="hidden lg:inline">Totais, gráficos e comparativo</span>
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-5 w-5 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-150",
              open && "rotate-180",
            )}
          />
        </button>
      </h2>

      <div id={detailsId} hidden={!open} className="flex flex-col gap-4">
        {open && (
          <>
            <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface lg:hidden">
              <GarageTileGrid className="grid-cols-1">
                <GarageTile
                  label="Próxima manutenção"
                  value={d.nextService?.name ?? "Nenhuma prevista"}
                  hint={nextServiceHint}
                  state={queryState(d.maintenanceQuery)}
                  wrap
                  fullHint
                  mono={false}
                />
              </GarageTileGrid>
            </div>
            <GarageSummary vehicles={vehicles} />
            <GarageComparisonDashboard vehicles={vehicles} />
          </>
        )}
      </div>
    </section>
  );
}
