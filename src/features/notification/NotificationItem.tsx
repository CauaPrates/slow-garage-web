import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { translatePostgresError } from "@/lib/postgresErrors";
import { useIsAdmin } from "@/features/admin/useIsAdmin";
import { InviteResponse } from "./InviteResponse";
import {
  notificationData,
  useDeleteNotification,
  useMarkNotificationRead,
  type NotificationRow,
} from "./useNotifications";

type NotificationItemProps = {
  notification: NotificationRow;
  /** Chamado ao seguir um link da notificação — o menu fecha. */
  onNavigate: () => void;
};

const LINK_CLASSNAME =
  "inline-flex min-h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline";

/**
 * `title`/`body` chegam prontos em pt-BR; a ação de cada notificação sai
 * de `type` + `data`, nunca do texto (docs/API_CONTRACT.md, Fase 14).
 * Links pro painel só aparecem enquanto `is_admin` for `true` — quem foi
 * rebaixado depois de receber a notificação não ganha um link que daria 403.
 */
export function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const { data: isAdmin } = useIsAdmin();
  const markRead = useMarkNotificationRead();
  const remove = useDeleteNotification();
  const [error, setError] = useState<string | null>(null);
  const isUnread = notification.read_at === null;
  const data = notificationData(notification);

  function markReadIfUnread() {
    if (isUnread) markRead.mutate(notification.id);
  }

  function followLink() {
    markReadIfUnread();
    onNavigate();
  }

  async function run(action: "read" | "delete") {
    setError(null);
    try {
      await (action === "read" ? markRead : remove).mutateAsync(notification.id);
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  let action: ReactNode = null;
  switch (notification.type) {
    case "admin_invite_received":
      action = (
        <InviteResponse inviteId={data.invite_id} onResolved={markReadIfUnread} onNavigate={followLink} />
      );
      break;
    case "admin_invite_accepted":
    case "admin_invite_declined":
      if (isAdmin && data.invitee_id) {
        action = (
          <Link to={ROUTES.adminUser(data.invitee_id)} onClick={followLink} className={LINK_CLASSNAME}>
            Ver usuário no painel
          </Link>
        );
      }
      break;
    case "admin_role_granted":
      if (isAdmin) {
        action = (
          <Link to={ROUTES.admin} onClick={followLink} className={LINK_CLASSNAME}>
            Ir para o painel
          </Link>
        );
      }
      break;
    case "admin_role_revoked":
      // Sem ação: o recheck de `is_admin` (tempo real) já tira a pessoa do painel.
      break;
  }

  return (
    <li
      className={cn(
        "flex gap-2 rounded-lg border p-3",
        isUnread ? "border-accent/30 bg-accent/5" : "border-border",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", isUnread ? "bg-accent" : "bg-transparent")}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={cn("text-sm text-text-primary", isUnread && "font-medium")}>
          {isUnread && <span className="sr-only">Não lida: </span>}
          {notification.title}
        </p>
        {notification.body && <p className="text-sm text-text-secondary">{notification.body}</p>}
        <time
          dateTime={notification.created_at}
          title={formatDateTime(notification.created_at)}
          className="text-xs text-text-secondary"
        >
          {formatRelativeTime(notification.created_at)}
        </time>
        {action && <div className="mt-1">{action}</div>}
        <FieldError>{error}</FieldError>
      </div>
      <div className="flex shrink-0 flex-col">
        {isUnread && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Marcar "${notification.title}" como lida`}
            disabled={markRead.isPending}
            onClick={() => run("read")}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Apagar "${notification.title}"`}
          disabled={remove.isPending}
          onClick={() => run("delete")}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
