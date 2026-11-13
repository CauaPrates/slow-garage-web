import { Badge, type BadgeTone } from "@/components/ui/badge";
import { INVITE_STATUS_LABELS, effectiveInviteStatus, type AdminInviteRow, type AdminInviteStatus } from "../useInvites";
import { ROLE_LABELS } from "../labels";
import type { AppRole } from "../useAdmin";

/**
 * Etapa 16: o Admin tinha selo próprio (classe local, `py-0.5`, peso normal).
 * Agora é o `Badge` comum — a forma e as cores moram lá; aqui fica só qual tom
 * cada papel e cada situação usa (o mesmo papel dos `*Presentation.ts`).
 */
const ROLE_TONE: Record<AppRole, BadgeTone> = {
  gearhead: "neutral",
  gearhead_admin: "accent",
};

/**
 * Tons da etapa 15 (`InviteResponse`): aceito = sucesso, recusado = neutro,
 * cancelado e expirado = tracejado (encerrado sem sucesso, nunca parece
 * concluído). Pendente = `info`: enviado e aguardando resposta — ainda não é
 * acesso concedido.
 */
export const INVITE_STATUS_TONE: Record<AdminInviteStatus, BadgeTone> = {
  pending: "info",
  accepted: "success",
  declined: "neutral",
  revoked: "dashed",
  expired: "dashed",
};

export function RoleBadge({ role }: { role: AppRole }) {
  return <Badge tone={ROLE_TONE[role]}>{ROLE_LABELS[role]}</Badge>;
}

/** Mostra o status **efetivo**: `pending` vencido aparece como "Expirado" (ver `effectiveInviteStatus`). */
export function InviteStatusBadge({ invite }: { invite: Pick<AdminInviteRow, "status" | "expires_at"> }) {
  const status = effectiveInviteStatus(invite);
  return <Badge tone={INVITE_STATUS_TONE[status]}>{INVITE_STATUS_LABELS[status]}</Badge>;
}
