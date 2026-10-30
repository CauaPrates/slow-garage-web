import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { HEADER_BADGE_CLASSNAME, HEADER_ICON_BUTTON_CLASSNAME } from "./navStyles";
import { translatePostgresError } from "@/lib/postgresErrors";
import { NotificationItem } from "@/features/notification/NotificationItem";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useNotificationsRealtime,
  useUnreadNotificationsCount,
} from "@/features/notification/useNotifications";

/**
 * Notificações in-app (Fase 031): contador de não lidas vindo do banco
 * (`count: 'exact', head: true`), as 20 mais recentes no popover, e
 * tempo real via `postgres_changes`. Ícone `Inbox`, não `Bell`: o sino
 * do header já é dos alertas de manutenção (`HeaderAlertsMenu`), e dois
 * sinos lado a lado não dizem qual é qual.
 */
export function HeaderNotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notificationsQuery = useNotifications();
  const unreadQuery = useUnreadNotificationsCount();
  const markAll = useMarkAllNotificationsRead();
  useNotificationsRealtime();

  const unread = unreadQuery.data ?? 0;
  const notifications = notificationsQuery.data ?? [];

  async function handleMarkAll() {
    setError(null);
    try {
      await markAll.mutateAsync();
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : "Notificações"}
          className={HEADER_ICON_BUTTON_CLASSNAME}
        >
          <Inbox className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span aria-hidden="true" className={cn(HEADER_BADGE_CLASSNAME, "bg-accent text-accent-foreground")}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" aria-labelledby="header-notifications-title">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="header-notifications-title" className="text-sm font-semibold text-text-primary">
            Notificações
          </h2>
          {unread > 0 && (
            <Button
              variant="ghost"
              className="h-11 px-2 text-xs text-accent"
              disabled={markAll.isPending}
              onClick={handleMarkAll}
            >
              {markAll.isPending ? "Marcando…" : "Marcar todas como lidas"}
            </Button>
          )}
        </div>
        <FieldError>{error}</FieldError>

        {notificationsQuery.isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-state-hover" />
            ))}
          </div>
        )}

        {notificationsQuery.isError && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <AlertCircle className="h-5 w-5 text-error" aria-hidden="true" />
            <p className="text-sm text-text-secondary">Não foi possível carregar as notificações.</p>
            <Button variant="ghost" onClick={() => notificationsQuery.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {notificationsQuery.data && notifications.length === 0 && (
          <p className="py-2 text-sm text-text-secondary">
            Nenhuma notificação. Convites e avisos da sua conta aparecem aqui.
          </p>
        )}

        {notifications.length > 0 && (
          <ul aria-label="Notificações recentes" className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </ul>
        )}

        <div className="mt-3 border-t border-border pt-2">
          <Link
            to={ROUTES.meusConvites}
            onClick={() => setOpen(false)}
            className="inline-flex min-h-11 items-center rounded-md px-1 text-sm text-text-secondary transition-colors duration-(--duration-fast) hover:text-text-primary"
          >
            Meus convites
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
