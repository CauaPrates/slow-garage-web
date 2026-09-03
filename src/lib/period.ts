import { endOfMonth, format, startOfMonth, startOfYear, subMonths } from "date-fns";

/** Compartilhado por todo filtro de período por `occurred_on` (Gasto desde a Fase 4, Timeline na Fase 9). */
export const PERIODS = ["all", "this-month", "last-month", "this-year"] as const;

export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  all: "Tudo",
  "this-month": "Este mês",
  "last-month": "Mês passado",
  "this-year": "Este ano",
};

const toDateOnly = (date: Date) => format(date, "yyyy-MM-dd");

/** `gte`/`lte` em `yyyy-MM-dd`, prontos pra `.gte()`/`.lte()` do supabase-js ou comparação lexicográfica direta (mesmo formato, mesma ordem). */
export function periodRange(period: Period): { gte?: string; lte?: string } {
  const now = new Date();
  switch (period) {
    case "this-month":
      return { gte: toDateOnly(startOfMonth(now)) };
    case "last-month": {
      const lastMonth = subMonths(now, 1);
      return { gte: toDateOnly(startOfMonth(lastMonth)), lte: toDateOnly(endOfMonth(lastMonth)) };
    }
    case "this-year":
      return { gte: toDateOnly(startOfYear(now)) };
    default:
      return {};
  }
}
