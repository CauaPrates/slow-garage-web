import { formatMoney } from "@/lib/format";

type VehicleInvestmentDatum = {
  vehicleId: string;
  label: string;
  totalInvested: number;
};

type VehicleInvestmentChartProps = {
  data: VehicleInvestmentDatum[];
};

/** Corte de legibilidade da lista, não de paleta (ver comentário do componente) — acima disso a leitura vira parede de barra. */
const MAX_ROWS = 8;

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
 */
export function VehicleInvestmentChart({ data }: VehicleInvestmentChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Nenhum veículo com gasto registrado ainda.
      </p>
    );
  }

  const sorted = [...data].sort((a, b) => b.totalInvested - a.totalInvested);
  const visible = sorted.slice(0, MAX_ROWS);
  const rest = sorted.slice(MAX_ROWS);
  const rows =
    rest.length > 0
      ? [
          ...visible,
          {
            vehicleId: "other",
            label: `Outros (${rest.length})`,
            totalInvested: rest.reduce((sum, r) => sum + r.totalInvested, 0),
          },
        ]
      : visible;

  const maxAmount = Math.max(...rows.map((r) => r.totalInvested));

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const widthPct =
          maxAmount > 0 ? (row.totalInvested / maxAmount) * 100 : 0;
        const isAggregate = row.vehicleId === "other";
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
                className="h-1.5"
                style={{
                  width: `${Math.max(widthPct, 2)}%`,
                  backgroundColor: isAggregate
                    ? "var(--color-text-secondary)"
                    : "var(--color-accent)",
                }}
                title={`${row.label}: ${formatMoney(row.totalInvested)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
