import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCount, formatDateOnly } from "@/lib/format";

type SignupsChartProps = {
  days: number;
  data: { day: string; signups: number }[];
};

/**
 * Cadastros por dia — coluna, hue único (`--color-accent`), mesma
 * linguagem do `ExpensesByMonthChart`. Com até 90 barras não cabe rótulo
 * em cada uma: o eixo mostra só o primeiro, o do meio e o último dia, e
 * o valor exato de cada dia fica no `title` da barra e na tabela
 * escondida pra leitor de tela. A série já vem com zeros do backend
 * (fuso de Brasília) — nada é preenchido nem somado aqui; o máximo serve
 * só pra escala da altura.
 *
 * A tabela fica dentro de um `div.sr-only`, nunca com `sr-only` nela
 * mesma: tabela ignora `height: 1px` e cresce até o conteúdo (até 90
 * linhas), e como o `absolute` escapava do `<main>`, a página inteira
 * ganhava ~2.000px de rolagem no desktop. O `div` corta em 1×1px, e o
 * `relative` do `figure` mantém o absoluto dentro do gráfico.
 */
export function SignupsChart({ days, data }: SignupsChartProps) {
  const max = Math.max(0, ...data.map((d) => d.signups));
  const tickIndexes = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

  return (
    <figure className="relative flex flex-col gap-3">
      <figcaption className="sr-only">Cadastros por dia nos últimos {days} dias</figcaption>
      <div aria-hidden="true" className="flex h-32 items-end gap-px">
        {data.map((d) => {
          const heightPct = max > 0 ? (d.signups / max) * 100 : 0;
          return (
            <div
              key={d.day}
              className="flex h-full min-w-0 flex-1 items-end"
              title={`${formatDateOnly(d.day)}: ${formatCount(d.signups)}`}
            >
              <div
                className={d.signups > 0 ? "w-full rounded-t-[2px] bg-accent" : "h-0.5 w-full bg-border"}
                style={d.signups > 0 ? { height: `${Math.max(heightPct, 4)}%` } : undefined}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="flex justify-between text-xs text-text-secondary">
        {data
          .filter((_, index) => tickIndexes.has(index))
          .map((d) => (
            <span key={d.day}>{format(parseISO(d.day), "dd/MM", { locale: ptBR })}</span>
          ))}
      </div>
      <div className="sr-only">
        <table>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">Cadastros</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.day}>
                <td>{formatDateOnly(d.day)}</td>
                <td>{formatCount(d.signups)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
