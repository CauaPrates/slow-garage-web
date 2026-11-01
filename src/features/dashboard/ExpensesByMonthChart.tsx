import { useId, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DashboardPanel } from "./DashboardPanel";
import type { DashboardExpensesByMonth } from "./types";

type ExpensesByMonthChartProps = {
  data: DashboardExpensesByMonth[];
  /** Ação do estado vazio (ex.: "Registrar gasto"), quando quem usa tem uma. */
  emptyAction?: ReactNode;
  className?: string;
};

/** Colunas na tela a partir de `sm`; o resto do histórico fica na tabela de valores. */
const MAX_COLUMNS = 12;
/** Abaixo de `sm` cabem 6 colunas legíveis em 320px — o recorte mais recente, identificado no subtítulo. */
const MOBILE_COLUMNS = 6;

const monthLong = (month: string) => format(parseISO(month), "MMMM 'de' yyyy", { locale: ptBR });
const monthShort = (month: string) => format(parseISO(month), "MMM/yy", { locale: ptBR });

/**
 * Hue único (`--color-accent`) — é uma série só (magnitude ao longo do
 * tempo), não identidade de categoria (ver skill `dataviz`).
 *
 * Etapa 05: volta a ser coluna, em ordem cronológica (mais antigo à
 * esquerda), com escala a partir de zero — a lista em linhas da etapa 04
 * perdia a leitura de evolução. Sem rolagem horizontal: até 12 colunas a
 * partir de `sm` e as 6 mais recentes no celular, sempre com o recorte
 * escrito; todos os meses ficam na tabela "Ver valores exatos". Cada coluna
 * leva o valor curto em cima (sem hover) e o valor exato pro leitor de tela.
 * A view só traz meses com registro: mês sem lançamento não aparece e não é
 * desenhado como zero; valor zero de verdade é coluna vazia com "0".
 */
export function ExpensesByMonthChart({ data, emptyAction, className }: ExpensesByMonthChartProps) {
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();

  const description = "Gastos, combustível, manutenção e itens de projeto, em R$. Só meses com registro.";

  if (data.length === 0) {
    return (
      <DashboardPanel title="Gasto por mês" description={description} headingLevel="h3" className={className}>
        <div className="flex flex-col items-start gap-3 p-4">
          <p className="text-sm text-text-secondary">Nenhum registro com valor ainda — o gráfico começa no primeiro.</p>
          {emptyAction}
        </div>
      </DashboardPanel>
    );
  }

  const chronological = [...data].sort((a, b) => a.month.localeCompare(b.month));
  const columns = chronological.slice(-MAX_COLUMNS);
  const maxAmount = Math.max(0, ...columns.map((d) => d.total_amount));
  const mobileHidden = (index: number) => index < columns.length - MOBILE_COLUMNS;
  const total = chronological.length;

  return (
    <DashboardPanel
      title="Gasto por mês"
      description={
        <>
          {description}
          {total > MOBILE_COLUMNS && (
            <span className="sm:hidden"> Últimos {MOBILE_COLUMNS} de {total} meses.</span>
          )}
          {total > MAX_COLUMNS && (
            <span className="hidden sm:inline"> Últimos {MAX_COLUMNS} de {total} meses.</span>
          )}
        </>
      }
      headingLevel="h3"
      className={className}
    >
      <div className="flex flex-1 flex-col gap-2 px-4 pt-4 pb-1">
        {/* `pt-5`: espaço do rótulo da coluna mais alta. Altura da barra = parte do total do mais alto, a partir de zero. */}
        <ol
          aria-label="Gasto por mês, do mais antigo ao mais recente"
          // Altura mínima de 11rem; ao lado do gráfico de categorias (mais alto), cresce em vez de deixar vazio embaixo.
          className="flex min-h-44 flex-1 items-stretch gap-1.5 border-b border-border-strong pt-5 sm:gap-2"
        >
          {columns.map((d, index) => {
            const pct = maxAmount > 0 ? (d.total_amount / maxAmount) * 100 : 0;
            return (
              <li
                key={d.month}
                className={cn("relative flex min-w-0 flex-1 justify-center", mobileHidden(index) && "max-sm:hidden")}
              >
                <span className="sr-only">
                  {monthLong(d.month)}: {formatMoney(d.total_amount)}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 w-full max-w-10 rounded-t-sm bg-accent"
                  style={{ height: `${pct}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute font-mono text-[11px] leading-4 whitespace-nowrap text-text-primary tabular-nums"
                  style={{ bottom: `calc(${pct}% + 0.25rem)` }}
                >
                  {formatMoneyCompact(d.total_amount)}
                </span>
              </li>
            );
          })}
        </ol>
        <div aria-hidden="true" className="flex gap-1.5 sm:gap-2">
          {columns.map((d, index) => (
            <span
              key={d.month}
              className={cn(
                "min-w-0 flex-1 text-center text-[11px] whitespace-nowrap text-text-secondary",
                mobileHidden(index) && "max-sm:hidden",
              )}
            >
              {monthShort(d.month)}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setTableOpen((current) => !current)}
        aria-expanded={tableOpen}
        aria-controls={tableId}
        className="mt-auto flex min-h-11 w-full items-center justify-between gap-2 border-t border-border px-4 py-2 text-left text-sm font-medium text-text-primary transition-colors duration-(--duration-fast) hover:bg-state-hover"
      >
        <span>
          Ver valores exatos
          <span className="font-normal text-text-secondary">
            {" "}
            — {total} {total === 1 ? "mês" : "meses"}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-(--duration-fast)",
            tableOpen && "rotate-180",
          )}
        />
      </button>
      <div id={tableId} hidden={!tableOpen}>
        <table className="w-full text-sm">
          <caption className="sr-only">Gasto por mês, do mais recente ao mais antigo</caption>
          <thead>
            <tr className="border-t border-border text-xs text-text-secondary">
              <th scope="col" className="px-4 py-2 text-left font-normal">
                Mês
              </th>
              <th scope="col" className="px-4 py-2 text-right font-normal">
                Valor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border border-t border-border">
            {[...chronological].reverse().map((d) => (
              <tr key={d.month}>
                <th scope="row" className="px-4 py-2 text-left font-normal text-text-primary first-letter:uppercase">
                  {monthLong(d.month)}
                </th>
                <td className="px-4 py-2 text-right font-mono text-text-primary tabular-nums">
                  {formatMoney(d.total_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
