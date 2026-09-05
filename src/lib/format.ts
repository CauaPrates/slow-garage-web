import { format as formatDateFns, parse as parseDateFns, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const integerFormatter = new Intl.NumberFormat("pt-BR");

const oneDecimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `1234.5` -> `"R$ 1.234,50"` */
export function formatMoney(value: number): string {
  return currencyFormatter.format(value);
}

/** `new Date(2026, 0, 5)` -> `"05/01/2026"` */
export function formatDate(date: Date): string {
  return formatDateFns(date, "dd/MM/yyyy", { locale: ptBR });
}

/** `"05/01/2026"` -> `Date`, ou `null` se a string não for uma data válida nesse formato */
export function parseDate(value: string): Date | null {
  const parsed = parseDateFns(value, "dd/MM/yyyy", new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * `"2026-01-15"` (coluna `date` do Postgres, mesmo formato do
 * `<input type="date">`) -> `"15/01/2026"`. Usa `parseISO` (não
 * `new Date(...)`) de propósito — o construtor nativo trata data sem
 * horário como meia-noite UTC, o que exibe o dia anterior em fuso
 * negativo (Brasil); `parseISO` trata como meia-noite local.
 */
export function formatDateOnly(isoDate: string): string {
  return formatDateFns(parseISO(isoDate), "dd/MM/yyyy", { locale: ptBR });
}

/**
 * "Hoje" em `yyyy-MM-dd` (formato de coluna `date` do Postgres e de
 * `<input type="date">`), usando o calendário **local**. `new
 * Date().toISOString()` usa UTC — em fuso negativo (Brasil, UTC-3),
 * depois que a meia-noite UTC já passou mas o dia local ainda não
 * virou, isso devolve a data de amanhã em vez de hoje. Usar sempre esta
 * função para pré-preencher campo de data com "hoje" em formulário.
 */
export function todayDateOnly(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `87400` -> `"87.400 km"` */
export function formatKm(value: number): string {
  return `${integerFormatter.format(value)} km`;
}

/** `87400` -> `"87.400"` — sem unidade, pra quando o "km" já aparece num rótulo separado ao lado/embaixo (ex.: mostrador de odômetro). */
export function formatKmValue(value: number): string {
  return integerFormatter.format(value);
}

/** `12.4` -> `"12,4 km/L"` */
export function formatConsumption(value: number): string {
  return `${oneDecimalFormatter.format(value)} km/L`;
}

/**
 * `45.7` -> `"45,7"` — para exibir em campo de formulário editável.
 * O usuário digita vírgula como separador decimal; ver `parseDecimalInput`.
 */
export function formatDecimalInput(value: number): string {
  return oneDecimalFormatter.format(value);
}

/**
 * `"45,7"` ou `"45.7"` -> `45.7`. `null` se não for um número válido.
 * Aceita tanto vírgula (entrada esperada do usuário pt-BR) quanto ponto,
 * porque copiar/colar ou teclado numérico de alguns celulares produz ponto.
 */
export function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "" || Number.isNaN(Number(normalized))) return null;
  return Number(normalized);
}
