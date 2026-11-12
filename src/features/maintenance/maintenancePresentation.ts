import type { BadgeTone } from "@/components/ui/badge";
import { formatDateOnly, formatKm, todayDateOnly } from "@/lib/format";
import type { Database } from "@/types/database.types";
import type { MaintenanceItemWithStatus } from "./useMaintenanceItems";

type StatusLevel = Database["public"]["Enums"]["maintenance_status_level"];

/**
 * Etapa 07: textos de Manutenção. Nada aqui decide se algo venceu — a
 * situação vem pronta de `maintenance_status` (e `vehicle_alerts`, que é
 * feita dela). Aqui só se escreve a data e a quilometragem que a view
 * entrega, relativas a hoje e ao odômetro do veículo.
 */

/**
 * Data de vencimento escrita conforme o dia: passou, é hoje ou ainda vem.
 * `YYYY-MM-DD` compara como texto. Antes o `AlertBanner` escrevia "Venceu em"
 * pra qualquer data, inclusive as futuras.
 */
export function dueDateLabel(dueOn: string, today = todayDateOnly()): string {
  if (dueOn < today) return `Venceu em ${formatDateOnly(dueOn)}`;
  if (dueOn === today) return "Vence hoje";
  return `Vence em ${formatDateOnly(dueOn)}`;
}

/**
 * "previsto − atual", com as duas pontas à vista — a mesma comparação que a
 * view faz (`current_odometer_km` contra `next_service_odometer_km`) e a
 * mesma conta do painel de pendências do dashboard. Sem odômetro, nada.
 */
export function kmDistanceLabel(dueKm: number, currentKm: number | null): string | null {
  if (currentKm == null) return null;
  const diff = dueKm - currentKm;
  if (diff > 0) return `faltam ${formatKm(diff)}`;
  if (diff < 0) return `passou ${formatKm(-diff)}`;
  return "atingido";
}

/** Situação temporal (da view). Texto + cor; prioridade e ativo/inativo nunca usam estas cores. */
export const STATUS_PRESENTATION: Record<StatusLevel, { label: string; tone: BadgeTone }> = {
  overdue: { label: "Vencida", tone: "error" },
  due_soon: { label: "Próxima", tone: "warning" },
  ok: { label: "Em dia", tone: "success" },
  // `planned` = nunca executado (API_CONTRACT): não é "em dia".
  planned: { label: "Sem execução", tone: "neutral" },
};

export const INACTIVE_PRESENTATION: { label: string; tone: BadgeTone } = { label: "Inativo", tone: "dashed" };

/** Mesma leitura de antes: `item.status` ausente conta como `planned`. */
export function itemStatus(item: MaintenanceItemWithStatus): StatusLevel {
  return item.status?.status ?? "planned";
}

/** "a cada 10.000 km ou 6 meses" — a view vence pelo que chegar primeiro. */
export function intervalDescription(item: Pick<MaintenanceItemWithStatus, "interval_km" | "interval_months">): string {
  const parts: string[] = [];
  if (item.interval_km != null) parts.push(formatKm(item.interval_km));
  if (item.interval_months != null) parts.push(`${item.interval_months} ${item.interval_months === 1 ? "mês" : "meses"}`);
  return parts.length ? `A cada ${parts.join(" ou ")}` : "Sem intervalo";
}

/** `secondary`: referência de apoio, escrita em tom secundário (ex.: a data de um item que venceu pela km). */
export type ReferenceLine = { key: "status" | "date" | "km"; text: string; detail: string | null; secondary?: boolean };

/**
 * Próxima referência, só com os intervalos que o item acompanha. Data e km
 * saem de `next_service_date`/`next_service_odometer_km` como estão; quando
 * a view não tem a referência (item nunca executado), a linha não aparece —
 * quem chama mostra "sem execução registrada" em vez de inventar um prazo.
 *
 * `neutral` (item inativo): a referência aparece como dado, sem "venceu" nem
 * "passou" — inativo não vence nem gera alerta, e o texto não inventa urgência.
 *
 * Vencida (status da view) com a data ainda por vir — ou sem data — só pode
 * ter vencido pela quilometragem (a view tem só esses dois critérios; mesma
 * leitura do `AlertBanner`). Aí a km vem primeiro, dizendo isso, e a data
 * fica como referência secundária, em vez de um "Vence em" ao lado do selo
 * "Vencida".
 */
export function nextReferences(
  item: MaintenanceItemWithStatus,
  currentKm: number | null,
  { neutral = false, today = todayDateOnly() }: { neutral?: boolean; today?: string } = {},
): ReferenceLine[] {
  const lines: ReferenceLine[] = [];
  const nextDate = item.status?.next_service_date ?? null;
  const nextKm = item.status?.next_service_odometer_km ?? null;
  const overdueByKm =
    !neutral &&
    itemStatus(item) === "overdue" &&
    item.interval_km != null &&
    nextKm != null &&
    !(item.interval_months != null && nextDate != null && nextDate <= today);
  if (overdueByKm) {
    lines.push({ key: "status", text: "Vencida por quilometragem", detail: null });
    lines.push({ key: "km", text: `Aos ${formatKm(nextKm)}`, detail: kmDistanceLabel(nextKm, currentKm) });
    if (item.interval_months != null && nextDate) {
      lines.push({ key: "date", text: `Data prevista ${formatDateOnly(nextDate)}`, detail: null, secondary: true });
    }
    return lines;
  }
  if (item.interval_months != null && nextDate) {
    lines.push({ key: "date", text: neutral ? `Data prevista ${formatDateOnly(nextDate)}` : dueDateLabel(nextDate), detail: null });
  }
  if (item.interval_km != null && nextKm != null) {
    lines.push({ key: "km", text: `Aos ${formatKm(nextKm)}`, detail: neutral ? null : kmDistanceLabel(nextKm, currentKm) });
  }
  return lines;
}

/** Última execução registrada no item (o trigger do banco grava data e km juntos). */
export function lastServiceLabel(item: MaintenanceItemWithStatus): string | null {
  const date = item.status?.last_service_date ?? item.last_service_date;
  const km = item.status?.last_service_odometer_km ?? item.last_service_odometer_km;
  const parts = [date ? formatDateOnly(date) : null, km != null ? formatKm(km) : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
