import { formatDateTime } from "@/lib/format";
import { effectiveInviteStatus, type AdminInviteRow } from "./useInvites";

type InviteDates = Pick<AdminInviteRow, "status" | "expires_at" | "resolved_at">;

/**
 * Etapa 16 — a validade de um convite numa frase, pela situação efetiva:
 * pendente diz até quando vale; expirado, quando venceu; respondido ou
 * cancelado, quando isso aconteceu (`resolved_at`). Nenhuma regra nova — a
 * validade continua sendo `expires_at` (`effectiveInviteStatus`).
 */
export function inviteValidityText(invite: InviteDates): string {
  const status = effectiveInviteStatus(invite);
  const resolved = invite.resolved_at ? formatDateTime(invite.resolved_at) : null;
  switch (status) {
    case "pending":
      return `Vale até ${formatDateTime(invite.expires_at)}`;
    case "expired":
      return `Venceu em ${formatDateTime(invite.expires_at)} sem resposta`;
    case "accepted":
      return resolved ? `Aceito em ${resolved}` : "Aceito";
    case "declined":
      return resolved ? `Recusado em ${resolved}` : "Recusado";
    case "revoked":
      return resolved ? `Cancelado em ${resolved}` : "Cancelado";
  }
}

/** O e-mail é só aviso: o convite e a notificação existem mesmo quando ele não sai (`email_sent_at` nulo). */
export function inviteEmailText(invite: Pick<AdminInviteRow, "email_sent_at">): string {
  return invite.email_sent_at ? "e-mail enviado" : "e-mail não saiu";
}
