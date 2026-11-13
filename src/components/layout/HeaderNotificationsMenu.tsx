import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/feedback";
import { FieldError } from "@/components/ui/field-error";
import { SkeletonList } from "@/components/ui/skeleton";
import { textLinkClassName } from "@/components/ui/text-link";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import {
  HEADER_BADGE_CLASSNAME,
  HEADER_ICON_BUTTON_CLASSNAME,
  HEADER_POPOVER_CLASSNAME,
  HEADER_POPOVER_LIST_CLASSNAME,
} from "./navStyles";
import { translatePostgresError } from "@/lib/postgresErrors";
import { NotificationItem } from "@/features/notification/NotificationItem";
import {
  RECENT_LIMIT,
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

/** "3 não lidas" / "Todas lidas", e o corte da lista quando ele existe. Só com o contador carregado — sem ele, nada é inventado. */
function summaryText(unread: number | undefined, listed: number): string | null {
  const status = unread === undefined ? null : unread > 0 ? `${unread} ${unread === 1 ? "não lida" : "não lidas"}` : listed > 0 ? "Todas lidas" : null;
  const capped = listed >= RECENT_LIMIT ? `as ${RECENT_LIMIT} mais recentes` : null;
  return [status, capped].filter(Boolean).join(" · ") || null;
}

/**
 * Conteúdo das notificações, sem o popover em volta — reaproveitado pelo
 * `HeaderInboxMenu` (cabeçalho estreito, redesign etapa 02). Mesmas queries
 * e mesma ação de "marcar todas"; o tempo real continua assinado uma vez só,
 * no `HeaderNotificationsMenu`.
 *
 * Etapa 15: a linha de resumo diz quantas não lidas (o mesmo número do
 * contador do botão, das mesmas consultas) e quando a lista mostra só as 20
 * mais recentes. "Marcar todas como lidas" em texto neutro (era laranja).
 * Carregando, falha (com "Tentar de novo") e vazio são estados distintos.
 * Só a lista rola; "Meus convites" fica fixo no rodapé. Depois de "marcar
 * todas" ou de apagar, o foco vai para a lista (antes caía no `<body>`).
 */
export function NotificationsPanel({ title, onNavigate }: NotificationsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const notificationsQuery = useNotifications();
  const unreadQuery = useUnreadNotificationsCount();
  const markAll = useMarkAllNotificationsRead();
  const listRef = useRef<HTMLUListElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const retry = useRetryFocus(notificationsQuery.dataUpdatedAt, rootRef);

  const unread = unreadQuery.data ?? 0;
  const notifications = notificationsQuery.data ?? [];
  const summary = summaryText(unreadQuery.data, notifications.length);

  function focusList() {
    (listRef.current ?? rootRef.current)?.focus();
  }

  async function handleMarkAll() {
    if (markAll.isPending) return;
    setError(null);
    try {
      await markAll.mutateAsync();
      focusList();
    } catch (mutationError) {
      setError(translatePostgresError(mutationError));
    }
  }

  return (
    <div ref={rootRef} tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
      {(title || summary || unread > 0) && (
        <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            {title}
            {summary && (
              <p aria-live="polite" className="type-caption text-text-secondary">
                {summary}
              </p>
            )}
          </div>
          {unread > 0 && (
            <button
              type="button"
              aria-disabled={markAll.isPending || undefined}
              onClick={handleMarkAll}
              className={cn(textLinkClassName("xs"), "-my-1 -mr-1 shrink-0 aria-disabled:opacity-50")}
            >
              {markAll.isPending ? "Marcando…" : "Marcar todas como lidas"}
            </button>
          )}
        </div>
      )}
      <div className="shrink-0">
        <FieldError>{error}</FieldError>
      </div>

      {notificationsQuery.isLoading && <SkeletonList label="Carregando notificações…" rows={2} className="p-0" />}

      {notificationsQuery.isError && (
        <InlineError onRetry={() => retry(notificationsQuery.refetch)} className="p-0">
          Não foi possível carregar as notificações.
        </InlineError>
      )}

      {notificationsQuery.data && notifications.length === 0 && (
        <p className="py-2 text-sm text-text-secondary">
          Nenhuma notificação. Convites e avisos da sua conta aparecem aqui.
        </p>
      )}

      {notifications.length > 0 && (
        <ul
          ref={listRef}
          tabIndex={-1}
          aria-label="Notificações recentes"
          className={cn(HEADER_POPOVER_LIST_CLASSNAME, "-mx-3 flex flex-col gap-2 px-3 py-0.5 outline-none")}
        >
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onNavigate={onNavigate}
              onDeleted={focusList}
            />
          ))}
        </ul>
      )}

      <div className="mt-2 shrink-0 border-t border-border pt-1">
        <Link to={ROUTES.meusConvites} onClick={onNavigate} className={cn(textLinkClassName("sm"), "text-text-secondary")}>
          Meus convites
        </Link>
      </div>
    </div>
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
      <PopoverContent className={HEADER_POPOVER_CLASSNAME} aria-labelledby="header-notifications-title">
        <NotificationsPanel
          title={
            <h2 id="header-notifications-title" className="type-section-title text-text-primary">
              Notificações
            </h2>
          }
          onNavigate={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
