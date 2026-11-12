import type { BadgeTone } from "@/components/ui/badge";
import { formatDateOnly } from "@/lib/format";
import { dueDateLabel } from "@/features/maintenance/maintenancePresentation";
import type { Database } from "@/types/database.types";
import type { DocumentRow } from "./useDocuments";
import type { ObligationRow } from "./useObligations";

type VehicleAlert = Database["public"]["Views"]["vehicle_alerts"]["Row"];

export type RecordStatus = { tone: BadgeTone; label: string };

/**
 * Etapa 11: a situação de documento e obrigação vem do mesmo lugar que o
 * dashboard, a Manutenção e o sino leem — `vehicle_alerts` (vencido =
 * `critical`; até 30 dias = `warning`). A tela não recalcula a janela de 30
 * dias. Os rótulos são os do painel de pendências do dashboard ("Vencido",
 * "Vence em breve", "Vencida", "Próxima"); "Vence hoje" só quando o alerta é
 * de aviso e a data é hoje — a view conta o próprio dia como "a vencer".
 *
 * Sem a lista de alertas (carregando ou com falha), fica a regra que a tela já
 * tinha: data anterior a hoje = vencido. Nenhum selo de aviso é inventado.
 */
export function findAlert(
  alerts: VehicleAlert[] | undefined,
  sourceTable: "documents" | "obligations",
  id: string,
): VehicleAlert | null {
  return alerts?.find((alert) => alert.source_table === sourceTable && alert.source_id === id) ?? null;
}

export function documentStatus(
  doc: DocumentRow,
  alert: VehicleAlert | null,
  alertsReady: boolean,
  today: string,
): RecordStatus | null {
  if (alert?.severity === "critical") return { tone: "error", label: "Vencido" };
  if (alert?.severity === "warning") {
    return doc.expires_on === today ? { tone: "warning", label: "Vence hoje" } : { tone: "warning", label: "Vence em breve" };
  }
  if (!alertsReady && doc.expires_on != null && doc.expires_on < today) return { tone: "error", label: "Vencido" };
  return null;
}

/** "Venceu em 03/11/2026", "Vence hoje", "Vence em 26/11/2026" ou a ausência escrita. */
export function documentValidityLabel(doc: DocumentRow, today: string): string {
  return doc.expires_on ? dueDateLabel(doc.expires_on, today) : "Sem validade informada";
}

export function obligationStatus(
  obligation: ObligationRow,
  alert: VehicleAlert | null,
  alertsReady: boolean,
  today: string,
): RecordStatus | null {
  // RN-3: paga nunca gera alerta, qualquer que seja a data.
  if (obligation.paid_on != null) return { tone: "success", label: "Paga" };
  if (alert?.severity === "critical") return { tone: "error", label: "Vencida" };
  if (alert?.severity === "warning") {
    return obligation.due_on === today ? { tone: "warning", label: "Vence hoje" } : { tone: "warning", label: "Próxima" };
  }
  if (!alertsReady && obligation.due_on != null && obligation.due_on < today) return { tone: "error", label: "Vencida" };
  return null;
}

/** A data que importa na linha: o pagamento, se houve; senão o vencimento (ou a falta dele). */
export function obligationDateLabel(obligation: ObligationRow, today: string): string {
  if (obligation.paid_on != null) return `Paga em ${formatDateOnly(obligation.paid_on)}`;
  return obligation.due_on ? dueDateLabel(obligation.due_on, today) : "Sem vencimento";
}

/** Tipo do arquivo como a pessoa conhece ("PDF", "Imagem"), a partir do `mime_type` salvo. */
export function fileKindLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Imagem";
  return "Arquivo";
}
