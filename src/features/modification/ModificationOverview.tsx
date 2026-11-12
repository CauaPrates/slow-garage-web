import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InlineError } from "@/components/ui/feedback";
import { SummaryStat, SummaryStrip, type SummaryState } from "@/components/ui/summary-strip";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type ModificationSummaryProps = {
  total: string;
  count: string;
  /** "7 registros" — a contagem por extenso, para a linha de apoio do celular. */
  countText: string;
  lastDate: string;
  /** Total e contagem: `vehicle_expenses_by_category`, lido do RPC do dashboard. */
  summaryState: SummaryState;
  /** Último registro: da lista de upgrades. */
  listState: SummaryState;
  onRetrySummary: () => void;
};

/**
 * Etapa 10: o resumo que a página já tinha (total e contagem da view por
 * categoria, último registro da lista), numa faixa compacta. A legenda diz o
 * escopo e que o total já está dentro dos gastos do veículo — não é um
 * investimento à parte. A falha do RPC não derruba a lista, e vice-versa.
 */
export function ModificationSummary({
  total,
  count,
  countText,
  lastDate,
  summaryState,
  listState,
  onRetrySummary,
}: ModificationSummaryProps) {
  return (
    <section aria-label="Resumo das modificações" className="flex flex-col gap-2">
      {/* Celular: duas células numa linha (a contagem vai sob o total); a partir de `sm`, três. */}
      <SummaryStrip className="grid-cols-2 sm:grid-cols-3">
        <SummaryStat label="Total em upgrades" value={total} mobileHint={countText} state={summaryState} />
        <SummaryStat label="Upgrades registrados" value={count} state={summaryState} className="hidden sm:flex" />
        <SummaryStat label="Último registro" value={lastDate} state={listState} />
      </SummaryStrip>
      {summaryState === "error" ? (
        <InlineError onRetry={onRetrySummary} className="p-0">
          Não foi possível carregar o total e a contagem.
        </InlineError>
      ) : (
        <p className="type-caption text-text-secondary">
          Todo o período. Já está dentro dos gastos e do total investido do veículo, não é um valor à parte.
        </p>
      )}
    </section>
  );
}

/** `"2026-10"` → `"out. 2026"`. */
function monthLabel(month: string) {
  return format(parseISO(`${month}-01`), "MMM yyyy", { locale: ptBR });
}

type ModificationMonthlyProps = {
  /** `[yyyy-MM, soma]`, em ordem cronológica — a mesma conta de antes, sobre a lista carregada. */
  months: [string, number][];
  className?: string;
};

/**
 * "Por mês": os últimos seis meses com upgrade, somados da lista carregada
 * (a conta que a página já fazia). Barra neutra — o laranja fica para ação e
 * navegação; o valor exato está escrito em cada linha.
 */
export function ModificationMonthly({ months, className }: ModificationMonthlyProps) {
  const max = Math.max(1, ...months.map(([, value]) => value));
  return (
    <section aria-labelledby="modifications-monthly-title" className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-0.5 border-b border-hairline pb-2">
        <h2 id="modifications-monthly-title" className="type-overline text-text-secondary">
          Upgrades por mês
        </h2>
        <p className="type-caption text-text-secondary">Últimos seis meses com registro, de todos os upgrades.</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {months.map(([month, value]) => (
          <li key={month} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3">
            <span className="type-caption text-text-secondary capitalize tabular-nums">{monthLabel(month)}</span>
            <span className="h-1.5 overflow-hidden rounded-sm bg-state-hover" aria-hidden="true">
              <span
                className="block h-full rounded-sm bg-text-secondary"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-sm text-text-primary tabular-nums">
              <span className="sr-only">: </span>
              {formatMoney(value)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
