import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FolderKanban, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatDateOnly } from "@/lib/format";
import {
  isKnownEventType,
  SOURCE_TABLE_TO_EVENT_TYPE,
  TIMELINE_EVENT_TYPE_FALLBACK_ICON,
  TIMELINE_EVENT_TYPE_ICONS,
  TIMELINE_EVENT_TYPE_LABELS,
} from "./schemas";
import { resolveTimelineLink } from "./timelineLinks";
import type { NoteLike } from "./useNotes";
import type { TimelineEventRow } from "./useTimeline";
import type { VehicleSearchResult } from "./useVehicleSearch";

/**
 * Etapa 13 — uma linha do Histórico, venha ela de `vehicle_timeline` (a lista)
 * ou de `search_vehicle` (a busca). Nada aqui consulta ou soma: só traduz o
 * que a view e a função já entregam para o que a linha mostra.
 */
export type TimelineEntry = {
  key: string;
  /** Rótulo do tipo, sempre escrito (o ícone sozinho não distingue). */
  typeLabel: string;
  icon: LucideIcon;
  /** `null` = o registro não tem título (nota sem título): a linha escreve "Sem título". */
  title: string | null;
  /** `yyyy-MM-dd`. */
  date: string | null;
  odometerKm: number | null;
  amount: number | null;
  description: string | null;
  /** Tela de origem — só quando existe. Nota e tipo desconhecido não têm. */
  href: string | null;
  /**
   * O que "Ver" abre, para o nome do link dizer a verdade: a **lista** de uma
   * tela (o registro não é aberto direto) ou o **detalhe do projeto**.
   */
  destination: { kind: "list"; screen: string } | { kind: "project"; self?: boolean } | null;
  /** Nota editável aqui (a única origem que o Histórico edita). */
  note: NoteLike | null;
};

/** Tipo fora dos sete conhecidos (a view mudou): rótulo genérico, nunca o nome cru da tabela. */
const UNKNOWN_TYPE_LABEL = "Registro";

/** Nome da tela de origem (o título dela), para "Ver lista de Manutenção". */
const LIST_SCREENS: Partial<Record<string, string>> = {
  expense: "Gastos",
  fuel_log: "Abastecimentos",
  maintenance_record: "Manutenção",
  issue: "Problemas",
  project_item: "Projetos",
  document: "Documentos",
};

/** O mesmo destino que `resolveTimelineLink` dá: o detalhe do projeto quando o link aponta pra um, senão a lista. */
function destinationOf(eventType: string | null, href: string | null, projectDetail: boolean): TimelineEntry["destination"] {
  if (!href) return null;
  if (projectDetail) return { kind: "project" };
  const screen = eventType ? LIST_SCREENS[eventType] : undefined;
  return screen ? { kind: "list", screen } : null;
}

/** `project_item` com `metadata.project_id` abre o detalhe do projeto (mesma leitura de `resolveTimelineLink`). */
function hasProjectId(metadata: unknown) {
  return !!metadata && typeof metadata === "object" && !Array.isArray(metadata) && typeof (metadata as Record<string, unknown>).project_id === "string";
}

/** Dados completos da nota a partir da linha da view (título, corpo, data e km — tudo o que o formulário edita). */
export function noteFromEvent(event: TimelineEventRow): NoteLike | null {
  if (event.event_type !== "note" || !event.source_id) return null;
  return {
    id: event.source_id,
    title: event.title,
    body: event.description,
    occurred_on: event.occurred_on ?? "",
    odometer_km: event.odometer_km,
  };
}

export function entryFromEvent(vehicleId: string, event: TimelineEventRow): TimelineEntry {
  const known = isKnownEventType(event.event_type);
  const href = resolveTimelineLink(vehicleId, event);
  return {
    key: `${event.source_table}-${event.source_id}`,
    typeLabel: known ? TIMELINE_EVENT_TYPE_LABELS[event.event_type as keyof typeof TIMELINE_EVENT_TYPE_LABELS] : UNKNOWN_TYPE_LABEL,
    icon: known ? TIMELINE_EVENT_TYPE_ICONS[event.event_type as keyof typeof TIMELINE_EVENT_TYPE_ICONS] : TIMELINE_EVENT_TYPE_FALLBACK_ICON,
    title: event.title,
    date: event.occurred_on,
    odometerKm: event.odometer_km,
    amount: event.amount,
    description: event.description?.trim() ? event.description : null,
    href,
    destination: destinationOf(event.event_type, href, event.event_type === "project_item" && hasProjectId(event.metadata)),
    note: noteFromEvent(event),
  };
}

/**
 * Resultado da busca. A função devolve menos que a view: sem valor, km nem
 * `metadata`, e o trecho são os 200 primeiros caracteres. Duas consequências:
 * - item de projeto leva à lista de Projetos (sem o `project_id`), como antes;
 * - a nota só é editável com os dados completos dela, lidos da lista do
 *   Histórico (`fullNote`). Editar a partir do trecho gravaria o texto cortado
 *   e apagaria a quilometragem.
 *
 * `projects` é a única origem da busca que não é evento da view: o
 * `source_id` é o próprio projeto, então "Ver" abre o detalhe dele.
 */
export function entryFromSearch(
  vehicleId: string,
  result: VehicleSearchResult,
  fullNote: NoteLike | null,
): TimelineEntry {
  const eventType = SOURCE_TABLE_TO_EVENT_TYPE[result.source_table];
  const isProject = result.source_table === "projects";
  const href = isProject
    ? ROUTES.vehicleProject(vehicleId, result.source_id)
    : eventType
      ? resolveTimelineLink(vehicleId, { event_type: eventType })
      : null;
  return {
    key: `${result.source_table}-${result.source_id}`,
    typeLabel: eventType ? TIMELINE_EVENT_TYPE_LABELS[eventType] : isProject ? "Projeto" : UNKNOWN_TYPE_LABEL,
    icon: eventType ? TIMELINE_EVENT_TYPE_ICONS[eventType] : isProject ? FolderKanban : TIMELINE_EVENT_TYPE_FALLBACK_ICON,
    title: result.title,
    date: result.occurred_on,
    odometerKm: fullNote?.odometer_km ?? null,
    amount: null,
    description: (fullNote ? fullNote.body : result.snippet)?.trim() ? (fullNote ? fullNote.body : result.snippet) : null,
    href,
    // Na busca o item de projeto vem sem `project_id`: a lista de Projetos. O projeto em si: o detalhe dele.
    destination: isProject ? { kind: "project", self: true } : destinationOf(eventType ?? null, href, false),
    note: eventType === "note" ? fullNote : null,
  };
}

/** O título é só o nome do tipo ("Abastecimento"): a linha não repete o rótulo. */
export function titleRepeatsType(entry: TimelineEntry) {
  return !!entry.title && entry.title.trim().toLocaleLowerCase("pt-BR") === entry.typeLabel.toLocaleLowerCase("pt-BR");
}

/**
 * Complemento do nome acessível de "Ver" (o nome começa sempre pela palavra
 * visível "Ver", para comando de voz e WCAG 2.5.3). Diz **para onde** o link
 * leva e **de qual registro** parte, porque a lista tem vários:
 * - lista da tela de origem: "lista de Manutenção, a partir de Troca de óleo
 *   e filtro, 10/11/2026" — o registro não é aberto direto, então o nome não
 *   promete isso;
 * - detalhe do projeto, a partir de um item: "projeto, a partir de Comando de
 *   válvulas 272°, 11/07/2026";
 * - o próprio projeto (busca): "projeto: Suspensão coilover, 11/09/2026".
 * Sem título (ou com o título igual ao tipo): "a partir do abastecimento de
 * 10/11/2026".
 */
export function viewLinkContext(entry: TimelineEntry) {
  const date = entry.date ? formatDateOnly(entry.date) : null;
  const titled = !!entry.title && !titleRepeatsType(entry);
  const source = titled
    ? `a partir de ${entry.title}${date ? `, ${date}` : ""}`
    : `a partir ${entry.typeLabel === "Manutenção" ? "da" : "do"} ${entry.typeLabel.toLocaleLowerCase("pt-BR")}${date ? ` de ${date}` : ""}`;
  const destination = entry.destination;
  if (destination?.kind === "project") {
    if (destination.self) return `projeto: ${entry.title ?? "sem nome"}${date ? `, ${date}` : ""}`;
    return `projeto, ${source}`;
  }
  if (destination?.kind === "list") return `lista de ${destination.screen}, ${source}`;
  return source;
}

export type TimelineMonth = { month: string; label: string; entries: TimelineEntry[] };

/**
 * Agrupa por mês **na ordem que veio** (a da view: data mais recente
 * primeiro). Não reordena nada: um grupo novo começa quando o mês muda.
 */
export function groupByMonth(entries: TimelineEntry[]): TimelineMonth[] {
  const groups: TimelineMonth[] = [];
  for (const entry of entries) {
    const month = entry.date ? entry.date.slice(0, 7) : "sem-data";
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.entries.push(entry);
    else groups.push({ month, label: monthLabel(month), entries: [entry] });
  }
  return groups;
}

function monthLabel(month: string) {
  if (month === "sem-data") return "Sem data";
  return format(parseISO(`${month}-01`), "MMMM 'de' yyyy", { locale: ptBR });
}

/** Coluna de data do desktop: "10 nov." e o dia da semana. */
export function dayParts(date: string) {
  const parsed = parseISO(date);
  return {
    day: format(parsed, "dd MMM", { locale: ptBR }),
    weekday: format(parsed, "EEEE", { locale: ptBR }),
  };
}
