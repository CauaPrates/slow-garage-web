import { cn } from "@/lib/utils";
import { formatKm, formatKmValue, formatMoney } from "@/lib/format";
import { useFlashOnChange } from "@/hooks/useFlashOnChange";
import type { DashboardExpensesByMonth } from "./types";

type VehicleMetricsRowProps = {
  currentOdometerKm: number | null;
  costPerKm: number | null;
  totalInvested: number | null;
  activeAlertsCount: number;
  expensesByMonth: DashboardExpensesByMonth[];
};

const GAUGE_RADIUS = 38;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
/** O arco cobre 270° do círculo (3/4) — o quarto restante fica aberto embaixo, como um mostrador de painel. */
const GAUGE_ARC_FRACTION = 0.75;
const GAUGE_ARC_LENGTH = GAUGE_CIRCUMFERENCE * GAUGE_ARC_FRACTION;
/** Km não tem "teto" real (não é velocidade, é odômetro de vida útil) — em vez de inventar um máximo, o arco preenche o progresso até o próximo múltiplo de 10.000km. É leitura de painel de verdade: o carro tem um marcador parecido pro "trip meter". */
const GAUGE_MILESTONE_KM = 10_000;

function OdometerGauge({ km }: { km: number | null }) {
  const flashing = useFlashOnChange(km);
  const progress = km != null ? (km % GAUGE_MILESTONE_KM) / GAUGE_MILESTONE_KM : 0;
  const filledLength = GAUGE_ARC_LENGTH * progress;

  return (
    <div
      role="img"
      aria-label={
        km != null
          ? `Odômetro: ${formatKm(km)}, ${Math.round(progress * 100)}% até os próximos ${GAUGE_MILESTONE_KM.toLocaleString("pt-BR")} km`
          : "Odômetro: sem dado"
      }
      className="relative flex h-24 w-24 shrink-0 items-center justify-center"
    >
      <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-[225deg]" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={GAUGE_RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${GAUGE_ARC_LENGTH} ${GAUGE_CIRCUMFERENCE}`}
        />
        <circle
          cx="50"
          cy="50"
          r={GAUGE_RADIUS}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${GAUGE_CIRCUMFERENCE}`}
          className="motion-safe:transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center rounded-full",
          flashing && "motion-safe:animate-value-flash",
        )}
      >
        <span className="font-mono text-sm font-medium text-text-primary">
          {km != null ? formatKmValue(km) : "—"}
        </span>
        <span className="text-[10px] text-text-secondary">km</span>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: DashboardExpensesByMonth[] }) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.total_amount);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 64;
  const height = 20;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-5 w-16 shrink-0"
      role="presentation"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
    </svg>
  );
}

/** Fase 14: odômetro é o elemento-assinatura (mostrador de painel); custo/km e total investido ficam calmos, com dado real (sparkline de gasto mensal), sem fabricar tendência que o banco não calcula. */
export function VehicleMetricsRow({
  currentOdometerKm,
  costPerKm,
  totalInvested,
  activeAlertsCount,
  expensesByMonth,
}: VehicleMetricsRowProps) {
  const costFlashing = useFlashOnChange(costPerKm);
  const investedFlashing = useFlashOnChange(totalInvested);
  const recentMonths = expensesByMonth.slice(-6);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex items-center justify-center rounded-lg border border-border bg-surface p-3 transition-shadow duration-150 hover:shadow-md">
        <OdometerGauge km={currentOdometerKm} />
      </div>

      <div className="flex flex-col justify-center gap-1 rounded-lg border border-border bg-surface p-4 transition-shadow duration-150 hover:shadow-md">
        <p className="text-xs text-text-secondary">Custo/km</p>
        <p
          className={cn(
            "rounded font-mono text-lg font-medium text-text-primary",
            costFlashing && "motion-safe:animate-value-flash",
          )}
        >
          {costPerKm != null ? `${formatMoney(costPerKm)}/km` : "—"}
        </p>
      </div>

      <div className="flex flex-col justify-center gap-1 rounded-lg border border-border bg-surface p-4 transition-shadow duration-150 hover:shadow-md">
        <p className="text-xs text-text-secondary">Total investido</p>
        <div className="flex items-end justify-between gap-2">
          <p
            className={cn(
              "rounded font-mono text-lg font-medium text-text-primary",
              investedFlashing && "motion-safe:animate-value-flash",
            )}
          >
            {totalInvested != null ? formatMoney(totalInvested) : "—"}
          </p>
          <Sparkline data={recentMonths} />
        </div>
      </div>

      <div className="flex flex-col justify-center gap-1 rounded-lg border border-border bg-surface p-4">
        <p className="text-xs text-text-secondary">Alertas ativos</p>
        <p className="flex items-center gap-2 text-lg font-medium text-text-primary">
          <span
            aria-hidden="true"
            className={cn(
              "h-2 w-2 rounded-full",
              activeAlertsCount > 0 ? "bg-accent motion-safe:animate-pulse" : "bg-border",
            )}
          />
          {activeAlertsCount}
        </p>
      </div>
    </div>
  );
}
