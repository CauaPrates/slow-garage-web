import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useUnreadNotificationsCount } from "@/features/notification/useNotifications";
import type { VehicleWithSummary } from "@/features/vehicle/useVehicles";
import { cn } from "@/lib/utils";
import { ActivityFeedPanel } from "./HeaderActivityMenu";
import { NotificationsPanel } from "./HeaderNotificationsMenu";
import { HEADER_BADGE_CLASSNAME, HEADER_ICON_BUTTON_CLASSNAME } from "./navStyles";

type HeaderInboxMenuProps = {
  vehicles: VehicleWithSummary[];
};

type Tab = "notifications" | "activity";

/**
 * Redesign etapa 02 — cabeçalho abaixo de `sm`. Com o logo completo e a troca
 * de veículo, os cinco botões do cabeçalho não cabem em 360px. Notificações e
 * atividade recente dividem um único botão, cada uma na sua aba: as fontes
 * continuam separadas (painéis próprios, extraídos dos menus de sempre), só o
 * ponto de entrada é comum. Alertas e o menu do usuário seguem com botão
 * próprio — alerta é pendência do carro, não caixa de entrada.
 *
 * O indicador é o mesmo das notificações (não lidas, no acento); atividade
 * nunca teve contador. Abas no padrão WAI-ARIA: setas trocam de aba, a aba
 * ativa tem fio + peso além da cor.
 */
export function HeaderInboxMenu({ vehicles }: HeaderInboxMenuProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("notifications");
  const unreadQuery = useUnreadNotificationsCount();
  const unread = unreadQuery.data ?? 0;
  const baseId = useId();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    notifications: null,
    activity: null,
  });
  const hasActivity = vehicles.length > 0;
  const tabs: { id: Tab; label: string }[] = [
    { id: "notifications", label: unread > 0 ? `Notificações (${unread})` : "Notificações" },
    ...(hasActivity ? [{ id: "activity" as const, label: "Atividade" }] : []),
  ];
  const current = hasActivity ? tab : "notifications";

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = tabs.findIndex((t) => t.id === current);
    const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  }

  const label = [
    hasActivity ? "Notificações e atividade recente" : "Notificações",
    unread > 0 ? `(${unread} não lidas)` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className={HEADER_ICON_BUTTON_CLASSNAME}>
          <Inbox className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span aria-hidden="true" className={cn(HEADER_BADGE_CLASSNAME, "bg-accent text-accent-foreground")}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" aria-label={label}>
        <div
          role="tablist"
          aria-label="Caixa de entrada"
          className="mb-3 flex border-b border-border"
        >
          {tabs.map((t) => {
            const selected = t.id === current;
            return (
              <button
                key={t.id}
                ref={(node) => {
                  tabRefs.current[t.id] = node;
                }}
                type="button"
                role="tab"
                id={`${baseId}-${t.id}-tab`}
                aria-selected={selected}
                aria-controls={`${baseId}-${t.id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "-mb-px flex min-h-11 flex-1 items-center justify-center border-b-2 px-2 text-sm transition-colors duration-(--duration-fast)",
                  selected
                    ? "border-accent font-semibold text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-${current}-panel`}
          aria-labelledby={`${baseId}-${current}-tab`}
        >
          {current === "notifications" ? (
            <NotificationsPanel onNavigate={() => setOpen(false)} />
          ) : (
            <ActivityFeedPanel vehicles={vehicles} />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
