import { z } from "zod";
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Fuel,
  Receipt,
  StickyNote,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { optionalNonNegativeInt, optionalText } from "@/lib/schemaHelpers";

/**
 * Os 7 valores de `event_type` observados consultando `vehicle_timeline`
 * direto contra o veículo seed (`bob`/Chevrolet Opala) antes de escrever
 * a spec — não uma suposição. RN-3: obrigação/financiamento não geram
 * evento na view, então não entram aqui.
 */
export const TIMELINE_EVENT_TYPES = [
  "expense",
  "fuel_log",
  "maintenance_record",
  "issue",
  "project_item",
  "document",
  "note",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const TIMELINE_EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  expense: "Gasto",
  fuel_log: "Abastecimento",
  maintenance_record: "Manutenção",
  issue: "Problema",
  project_item: "Item de projeto",
  document: "Documento",
  note: "Nota",
};

export const TIMELINE_EVENT_TYPE_ICONS: Record<TimelineEventType, LucideIcon> = {
  expense: Receipt,
  fuel_log: Fuel,
  maintenance_record: Wrench,
  issue: AlertTriangle,
  project_item: ClipboardList,
  document: FileText,
  note: StickyNote,
};

/** Tipo fora dos 7 conhecidos (view mudou) cai aqui — nunca quebra a tela. */
export const TIMELINE_EVENT_TYPE_FALLBACK_ICON: LucideIcon = FileText;

export function isKnownEventType(value: string | null): value is TimelineEventType {
  return !!value && (TIMELINE_EVENT_TYPES as readonly string[]).includes(value);
}

/**
 * `search_vehicle` devolve `source_table` (nome da tabela, plural —
 * "expenses", "fuel_logs" etc.), diferente de `vehicle_timeline.event_type`
 * (singular — "expense", "fuel_log"). Mapeado contra o resultado real da
 * RPC, não suposto pelo nome da tabela.
 */
export const SOURCE_TABLE_TO_EVENT_TYPE: Record<string, TimelineEventType> = {
  expenses: "expense",
  fuel_logs: "fuel_log",
  maintenance_records: "maintenance_record",
  issues: "issue",
  project_items: "project_item",
  documents: "document",
  notes: "note",
};

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  body: optionalText,
  occurredOn: z.string().min(1, "Informe a data."),
  odometerKm: optionalNonNegativeInt("a quilometragem"),
});

export type NoteFormInput = z.input<typeof noteSchema>;
export type NoteFormOutput = z.output<typeof noteSchema>;
