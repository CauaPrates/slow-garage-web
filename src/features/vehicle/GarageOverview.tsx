import { useId } from "react";
import { Check, ChevronDown } from "lucide-react";
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

type StatValue =
  /** Número em fonte display (contagem, dinheiro). `spoken` é o que o leitor de tela lê, quando o visual é estilizado ("02"). */
  | { kind: "number"; value: string; spoken?: string }
  /** Texto (nome de manutenção): fonte de interface, até duas linhas. */
  | { kind: "text"; value: string }
  /** "Nada pendente": ícone de confirmação + texto curto. */
  | { kind: "ok"; value: string };

/**
 * Célula do resumo da garagem — Garagem A3 (ADR-094): rótulo pequeno em
 * caixa-alta sobre o valor, filete vertical entre células, como a ficha de
 * dados de uma revista. Mesmo contrato de estados de antes (carregando, erro
 * com "Tentar de novo" — nunca vira zero nem "nada pendente" —, pronto).
 * Fica só na Garagem; o `GarageTile` dos outros painéis não mudou.
 */
function GarageStat({
  label,
  value,
  hint,
  state = { status: "ready" },
  className,
}: {
  label: string;
  value: StatValue;
  hint?: string;
  state?: GarageTileState;
  className?: string;
}) {
  return (
    <div className={cn("garage-stat", className)}>
      <dt className="garage-stat__label">{label}</dt>
      <dd className="flex min-w-0 flex-col items-start">
        {state.status === "loading" && (
          <>
            <span className="sr-only">Carregando…</span>
            <span className="mt-1 block h-5 w-16 animate-pulse rounded-sm bg-state-hover" aria-hidden="true" />
          </>
        )}
        {state.status === "error" && (
          <>
            <span className="text-xs text-error">Não foi possível carregar.</span>
            <button
              type="button"
              onClick={state.onRetry}
              className="-ml-1 flex min-h-11 items-center px-1 text-xs font-medium text-text-primary underline decoration-border-strong underline-offset-4 hover:decoration-text-primary"
            >
              Tentar de novo
            </button>
          </>
        )}
        {state.status === "ready" && (
          <>
            {value.kind === "number" && (
              <span className="garage-stat__value">
                {value.spoken ? (
                  <>
                    <span aria-hidden="true">{value.value}</span>
                    <span className="sr-only">{value.spoken}</span>
                  </>
                ) : (
                  value.value
                )}
              </span>
            )}
            {value.kind === "text" && (
              <span className="garage-stat__value garage-stat__value--text" title={value.value}>
                {value.value}
              </span>
            )}
            {value.kind === "ok" && (
              <span className="garage-stat__ok">
                <Check className="h-4 w-4" aria-hidden="true" />
                {value.value}
              </span>
            )}
            {hint && (
              <span className="garage-stat__hint max-w-full" title={hint}>
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

type GarageDetailsControl = {
  open: boolean;
  onToggle: () => void;
  /** `id` do painel de detalhes (`GarageDetails`) que este botão abre e fecha. */
  controlsId: string;
};

/**
 * Resumo do topo da garagem — Garagem A3 (ADR-094): uma faixa de dados logo
 * abaixo da capa, com o botão "Detalhes e comparativo" no fim. Mesmas
 * consultas e contas da recalibração 01 (ADR-093); mudou a apresentação.
 *
 * - 2+ veículos, desktop: Veículos, Gasto no mês, Pendências, Manutenção
 *   prevista. No celular só Gasto no mês e Pendências (a contagem já está no
 *   título "Seus veículos", e a próxima manutenção abre nos detalhes).
 * - 1 veículo: Pendências e Manutenção prevista — o resto já está no card
 *   (ADR-051) —, sem botão de detalhes (não há o que comparar).
 *
 * Zero pendência e nenhuma manutenção prevista viram "Nenhuma" com o ícone
 * de confirmação; com pendência, o número e a dica de vencidas.
 */
export function GarageOverview({
  vehicles,
  details,
}: GarageOverviewProps & { details?: GarageDetailsControl }) {
  const titleId = useId();
  const d = useGarageOverviewData(vehicles);
  const count = vehicles.length;

  return (
    <section aria-labelledby={titleId} className="garage-summary garage-inset">
      <h2 id={titleId} className="sr-only">
        Resumo da garagem
      </h2>
      <dl className="garage-summary__cells">
        {d.isGarage && (
          <>
            <GarageStat
              label="Veículos"
              value={{ kind: "number", value: String(count).padStart(2, "0"), spoken: String(count) }}
              className="hidden lg:flex"
            />
            <GarageStat
              label="Gasto no mês"
              value={{ kind: "number", value: d.withSummary.length > 0 ? formatMoney(d.monthSpend) : "—" }}
              hint={d.missingSummary > 0 ? `sem dado de ${plural(d.missingSummary, "veículo", "veículos")}` : undefined}
            />
          </>
        )}
        <GarageStat
          label="Pendências"
          value={
            d.alerts.length === 0
              ? { kind: "ok", value: "Nenhuma" }
              : { kind: "number", value: String(d.alerts.length) }
          }
          hint={d.alerts.length > 0 ? d.alertsHint : undefined}
          state={queryState(d.alertsQuery)}
        />
        <GarageStat
          label="Manutenção prevista"
          value={d.nextService?.name ? { kind: "text", value: d.nextService.name } : { kind: "ok", value: "Nenhuma" }}
          hint={d.nextService ? [d.nextServiceDate, d.nextServiceVehicle].filter(Boolean).join(" · ") : undefined}
          state={queryState(d.maintenanceQuery)}
          className={d.isGarage ? "hidden lg:flex" : undefined}
        />
      </dl>
      {d.isGarage && details && (
        <button
          type="button"
          onClick={details.onToggle}
          aria-expanded={details.open}
          aria-controls={details.controlsId}
          className="garage-summary__details inline-flex min-h-11 items-center gap-1.5 rounded-md pl-2 text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover lg:border lg:border-border-strong/60 lg:px-3.5"
        >
          {/* No celular o rótulo encurta; o nome acessível é sempre o inteiro. Um só filho flex: sem vão duplo. */}
          <span>
            Detalhes<span className="sr-only lg:not-sr-only"> e comparativo</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 text-text-secondary motion-safe:transition-transform motion-safe:duration-150",
              details.open && "rotate-180",
            )}
          />
        </button>
      )}
    </section>
  );
}

/**
 * Detalhes e comparativo — o mesmo conteúdo recolhido da recalibração 01
 * (resumo financeiro, gráficos, comparativo, e no celular a próxima
 * manutenção por extenso), sem mudar conta nenhuma. Garagem A3: o gatilho
 * saiu do título desta seção e foi para a faixa de resumo
 * (`GarageOverview`); o painel abre logo abaixo dela, recolhido por padrão.
 * O conteúdo só monta aberto (os gráficos não consultam à toa).
 */
export function GarageDetails({ vehicles, id, open }: GarageOverviewProps & { id: string; open: boolean }) {
  const titleId = useId();
  const d = useGarageOverviewData(vehicles);

  if (!d.isGarage) return null;

  const nextServiceHint = d.nextService
    ? [d.nextServiceVehicle, d.nextServiceDate].filter(Boolean).join(" · ")
    : undefined;

  return (
    <section id={id} hidden={!open} aria-labelledby={titleId} className="garage-inset flex flex-col gap-4 pt-5">
      <h2 id={titleId} className="font-display text-lg leading-tight font-bold tracking-tight text-text-primary">
        Detalhes e comparativo
      </h2>
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
    </section>
  );
}
