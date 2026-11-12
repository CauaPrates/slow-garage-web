import { useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { textLinkClassName } from "@/components/ui/text-link";
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
  /** Depois de apagar: o item some, e quem envolve decide pra onde vai o foco. */
  onDeleted: () => void;
};

const LINK_CLASSNAME = cn(textLinkClassName("sm"), "-ml-1");

/**
 * `title`/`body` chegam prontos em pt-BR; a ação de cada notificação sai
 * de `type` + `data`, nunca do texto (docs/API_CONTRACT.md, Fase 14).
 * Links pro painel só aparecem enquanto `is_admin` for `true` — quem foi
 * rebaixado depois de receber a notificação não ganha um link que daria 403.
 *
 * Etapa 15: título, texto e ação primeiro; "Não lida" escrito (além do fio
 * lateral e do peso — antes só cor, peso e um texto oculto); a data relativa
 * com a data completa no `title`. As ações da linha (marcar como lida,
 * apagar) ficam numa coluna de 44px que não encolhe: no celular o texto quebra
 * em linhas e os botões não são espremidos. Marcar como lida mantém o foco na
 * linha (vai para "Apagar", que continua ali); antes ele caía no `<body>`.
 */
export function NotificationItem({ notification, onNavigate, onDeleted }: NotificationItemProps) {
  const { data: isAdmin } = useIsAdmin();
  const markRead = useMarkNotificationRead();
  const remove = useDeleteNotification();
  const [error, setError] = useState<string | null>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
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
    const mutation = action === "read" ? markRead : remove;
    if (mutation.isPending) return;
    setError(null);
    try {
      await mutation.mutateAsync(notification.id);
      if (action === "read") deleteRef.current?.focus();
      else onDeleted();
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  let action: ReactNode = null;
  switch (notification.type) {
    case "admin_invite_received":
      action = (
        <InviteResponse inviteId={data.invite_id} onResolved={markReadIfUnread} onNavigate={followLink} compact />
      );
      break;
    case "admin_invite_accepted":
    case "admin_invite_declined":
      if (isAdmin && data.invitee_id) {
        action = (
          <Link
            to={ROUTES.adminUser(data.invitee_id)}
            onClick={followLink}
            aria-describedby={titleId}
            className={LINK_CLASSNAME}
          >
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
        "flex gap-2 rounded-lg border py-2.5 pr-1 pl-3",
        isUnread ? "border-l-2 border-border border-l-accent bg-accent/5" : "border-border",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <p className="type-caption flex flex-wrap items-center gap-x-1.5 text-text-secondary">
          {isUnread && (
            <>
              <span className="font-semibold text-text-primary">Não lida</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={notification.created_at} title={formatDateTime(notification.created_at)}>
            {formatRelativeTime(notification.created_at)}
          </time>
        </p>
        <p id={titleId} className={cn("type-item-title text-text-primary", isUnread && "font-semibold")}>
          {notification.title}
        </p>
        {notification.body && <p className="text-sm break-words text-text-secondary">{notification.body}</p>}
        {action && <div className="mt-1">{action}</div>}
        <FieldError>{error}</FieldError>
      </div>
      <div className="flex shrink-0 flex-col">
        {isUnread && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Marcar "${notification.title}" como lida`}
            aria-disabled={markRead.isPending || undefined}
            onClick={() => run("read")}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        <Button
          ref={deleteRef}
          variant="ghost"
          size="icon"
          aria-label={`Apagar "${notification.title}"`}
          aria-disabled={remove.isPending || undefined}
          onClick={() => run("delete")}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
