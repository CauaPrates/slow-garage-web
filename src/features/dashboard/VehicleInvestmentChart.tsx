import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type VehicleInvestmentDatum = {
  vehicleId: string;
  label: string;
  totalInvested: number;
};

type VehicleInvestmentChartProps = {
  data: VehicleInvestmentDatum[];
};

/** Quantas barras aparecem antes de o usuário pedir o resto (Fase 15f). */
const COLLAPSED_ROWS = 4;

/**
 * Fase 15d: barra em hue único (`--color-accent`), não na paleta categórica
 * de 8 slots que a v1 usava por ter copiado o `ExpensesByCategoryChart`. A
 * regra do projeto (skill `dataviz`, e o comentário do
 * `ExpensesByMonthChart`) é que categórica só vale quando a série **é** o
 * assunto — aqui a cor não mapeia pra nada: cada barra já tem o nome do
 * veículo colado nela, e todas medem a mesma coisa (dinheiro investido), então
 * é comparação de magnitude, o caso de hue único. Trilho reto e fino
 * (`h-1.5`, sem raio) em vez da cápsula `rounded-full` grossa da v1 — mesmo
 * tratamento de linha das bordas do card de veículo.
 *
 * Fase 15f: acordeão de 4 barras. A v1 mostrava 8 + uma barra "Outros" com a
 * soma do resto; virou lista curta com gatilho pro resto porque "Outros" era
 * uma barra que parecia veículo sem ser, e a soma dela já está em "Total
 * investido" no `GarageSummary`. A escala (`maxAmount`) sai sempre do conjunto
 * inteiro, não das linhas visíveis — abrir e fechar não pode reescalar barra
 * nenhuma, senão a mesma quantia mudaria de tamanho na frente do usuário.
 */
export function VehicleInvestmentChart({ data }: VehicleInvestmentChartProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  if (data.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Nenhum veículo com gasto registrado ainda.
      </p>
    );
  }

  const sorted = [...data].sort((a, b) => b.totalInvested - a.totalInvested);
  const maxAmount = Math.max(...sorted.map((r) => r.totalInvested));
  const hasMore = sorted.length > COLLAPSED_ROWS;
  const rows = expanded ? sorted : sorted.slice(0, COLLAPSED_ROWS);

  return (
    <div className="flex flex-col gap-3">
      <div id={listId} className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const widthPct =
            maxAmount > 0 ? (row.totalInvested / maxAmount) * 100 : 0;
          return (
            <div key={row.vehicleId} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 truncate text-text-primary">
                  {row.label}
                </span>
                <span className="shrink-0 font-mono text-text-secondary">
                  {formatMoney(row.totalInvested)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-border">
                <div
                  className="h-1.5 bg-accent"
                  style={{ width: `${Math.max(widthPct, 2)}%` }}
                  title={`${row.label}: ${formatMoney(row.totalInvested)}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={listId}
          className="flex min-h-11 items-center gap-1.5 self-start text-xs font-medium text-accent hover:underline"
        >
          {expanded ? "Ver menos" : `Ver todos os ${sorted.length} veículos`}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-150",
              expanded && "rotate-180",
            )}
          />
        </button>
      )}
    </div>
  );
}
