import { cn } from "@/lib/utils";
import { INVITE_STATUS_LABELS, effectiveInviteStatus, type AdminInviteRow } from "../useInvites";
import { ROLE_LABELS } from "../labels";
import type { AppRole } from "../useAdmin";

const BADGE_BASE = "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs whitespace-nowrap";

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span
      className={cn(
        BADGE_BASE,
        role === "gearhead_admin"
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border text-text-secondary",
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

const INVITE_STATUS_CLASSNAME = {
  pending: "border-warning/40 bg-warning/10 text-warning",
  accepted: "border-success/40 bg-success/10 text-success",
  declined: "border-border text-text-secondary",
  revoked: "border-border text-text-secondary",
  expired: "border-error/40 bg-error/10 text-error",
} as const;

/** Mostra o status **efetivo**: `pending` vencido aparece como "Expirado" (ver `effectiveInviteStatus`). */
export function InviteStatusBadge({ invite }: { invite: Pick<AdminInviteRow, "status" | "expires_at"> }) {
  const status = effectiveInviteStatus(invite);
  return (
    <span className={cn(BADGE_BASE, INVITE_STATUS_CLASSNAME[status])}>
      {INVITE_STATUS_LABELS[status]}
    </span>
  );
}
