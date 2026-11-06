import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatState = "loading" | "error" | "ready";

type Stat = {
  label: string;
  value: string;
  state: StatState;
  /** Linha de apoio só no celular (a contagem, que lá não tem célula própria). */
  mobileHint?: string;
  className?: string;
};

/**
 * Célula do resumo: rótulo pequeno em caixa-alta sobre o valor, filete entre
 * células — o idioma da faixa de resumo da Garagem, sem caixa por número.
 * Carregando é um traço pulsante (nunca um zero), falha é "Indisponível".
 */
function SummaryStat({ label, value, state, mobileHint, className }: Stat) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 px-4 py-2.5 sm:gap-1 sm:py-3", className)}>
      <dt className="text-xs font-semibold tracking-wider text-text-secondary uppercase">{label}</dt>
      <dd className="min-w-0">
        {state === "loading" && (
          <>
            <span className="sr-only">Carregando…</span>
            <span className="block h-6 w-24 animate-pulse rounded-sm bg-state-hover" aria-hidden="true" />
          </>
        )}
        {state === "error" && <span className="text-sm text-text-secondary">Indisponível</span>}
        {state === "ready" && (
          <>
            <span className="font-display text-lg leading-6 font-bold break-words text-text-primary tabular-nums sm:text-xl">
              {value}
            </span>
            {mobileHint && <span className="block text-xs text-text-secondary sm:hidden">{mobileHint}</span>}
          </>
        )}
      </dd>
    </div>
  );
}

type ModificationSummaryProps = {
  total: Stat["value"];
  count: Stat["value"];
  /** "7 registros" — a contagem por extenso, para a linha de apoio do celular. */
  countText: string;
  lastDate: Stat["value"];
  /** Total e contagem: `vehicle_expenses_by_category`, lido do RPC do dashboard. */
  summaryState: StatState;
  /** Último registro: da lista de upgrades. */
  listState: StatState;
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
      <dl className="-mx-4 grid grid-cols-2 border-y border-hairline sm:grid-cols-3">
        <SummaryStat label="Total em upgrades" value={total} mobileHint={countText} state={summaryState} />
        <SummaryStat
          label="Upgrades registrados"
          value={count}
          state={summaryState}
          className="hidden border-l border-hairline sm:flex"
        />
        <SummaryStat label="Último registro" value={lastDate} state={listState} className="border-l border-hairline" />
      </dl>
      {summaryState === "error" ? (
        <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="flex items-center gap-2 text-xs text-text-secondary">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
            Não foi possível carregar o total e a contagem.
          </p>
          <Button variant="outline" onClick={onRetrySummary}>
            Tentar de novo
          </Button>
        </div>
      ) : (
        <p className="text-xs text-text-secondary">
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
        <h2
          id="modifications-monthly-title"
          className="text-xs font-semibold tracking-wider text-text-secondary uppercase"
        >
          Upgrades por mês
        </h2>
        <p className="text-xs text-text-secondary">Últimos seis meses com registro, de todos os upgrades.</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {months.map(([month, value]) => (
          <li key={month} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3">
            <span className="text-xs text-text-secondary capitalize tabular-nums">{monthLabel(month)}</span>
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
