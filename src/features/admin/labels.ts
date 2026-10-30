import type { AppRole, AuditAction } from "./useAdmin";

export const ROLE_LABELS: Record<AppRole, string> = {
  gearhead: "Gearhead",
  gearhead_admin: "Administrador Gearhead",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  user_signed_up: "Cadastro",
  role_changed: "Mudança de role",
  admin_invite_created: "Convite enviado",
  admin_invite_accepted: "Convite aceito",
  admin_invite_declined: "Convite recusado",
  admin_invite_revoked: "Convite cancelado",
  admin_invite_expired: "Convite expirado",
};

/** `metadata.source` de `role_changed` — valores gravados por `private.after_user_role_change` no backend. */
const ROLE_CHANGE_SOURCE_LABELS: Record<string, string> = {
  invite: "via convite",
  revoke: "remoção pelo painel",
  manual: "manual, direto no banco",
  app: "pelo app",
};

function roleLabel(value: unknown): string {
  return typeof value === "string" && value in ROLE_LABELS
    ? ROLE_LABELS[value as AppRole]
    : String(value ?? "—");
}

/** Linha de detalhe de um evento do log, a partir de `metadata`. `null` quando não há nada útil pra mostrar além da ação. */
export function describeAuditMetadata(
  action: AuditAction,
  metadata: Record<string, unknown>,
): string | null {
  if (action === "role_changed") {
    const source = typeof metadata.source === "string" ? metadata.source : null;
    const sourceLabel = source ? (ROLE_CHANGE_SOURCE_LABELS[source] ?? source) : null;
    const change = `${roleLabel(metadata.from)} → ${roleLabel(metadata.to)}`;
    return sourceLabel ? `${change} (${sourceLabel})` : change;
  }
  if (action === "user_signed_up" && metadata.backfilled === true) {
    return "Registrado retroativamente, na criação do log";
  }
  return null;
}

/** `actor_id` nulo = mudança feita direto no banco (docs/API_CONTRACT.md, Fase 14). */
export const SYSTEM_ACTOR_LABEL = "Sistema / manual";
