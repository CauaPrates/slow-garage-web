import { useState, type ReactNode } from "react";
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

type NotificationsPanelProps = {
  /** Título à esquerda da linha de ações; omitido quando quem envolve já nomeia o painel (aba do `HeaderInboxMenu`). */
  title?: ReactNode;
  /** Chamado ao seguir um link de dentro do painel — quem envolve fecha o popover. */
  onNavigate: () => void;
};

/**
 * Conteúdo das notificações, sem o popover em volta — reaproveitado pelo
 * `HeaderInboxMenu` (cabeçalho estreito, redesign etapa 02). Mesmas queries
 * e mesma ação de "marcar todas"; o tempo real continua assinado uma vez só,
 * no `HeaderNotificationsMenu`.
 */
export function NotificationsPanel({ title, onNavigate }: NotificationsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const notificationsQuery = useNotifications();
  const unreadQuery = useUnreadNotificationsCount();
  const markAll = useMarkAllNotificationsRead();

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
    <>
      {(title || unread > 0) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title ?? <span />}
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
      )}
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
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}

      <div className="mt-3 border-t border-border pt-2">
        <Link
          to={ROUTES.meusConvites}
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center rounded-md px-1 text-sm text-text-secondary transition-colors duration-(--duration-fast) hover:text-text-primary"
        >
          Meus convites
        </Link>
      </div>
    </>
  );
}

/**
 * Notificações in-app (Fase 031): contador de não lidas vindo do banco
 * (`count: 'exact', head: true`), as 20 mais recentes no popover, e
 * tempo real via `postgres_changes`. Ícone `Inbox`, não `Bell`: o sino
 * do header já é dos alertas de manutenção (`HeaderAlertsMenu`), e dois
 * sinos lado a lado não dizem qual é qual.
 *
 * Redesign etapa 02: abaixo de `sm` este botão fica oculto (o
 * `HeaderInboxMenu` assume), mas o componente continua montado — é ele que
 * mantém a única assinatura de tempo real.
 */
export function HeaderNotificationsMenu() {
  const [open, setOpen] = useState(false);
  const unreadQuery = useUnreadNotificationsCount();
  // A lista já chega carregada quando o popover abre, como antes da extração do painel.
  useNotifications();
  useNotificationsRealtime();

  const unread = unreadQuery.data ?? 0;

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
        <NotificationsPanel
          title={
            <h2 id="header-notifications-title" className="text-sm font-semibold text-text-primary">
              Notificações
            </h2>
          }
          onNavigate={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
