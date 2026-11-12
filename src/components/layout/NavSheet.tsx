import { useId } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link, NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveNavItem, type NavGroup, type NavItem } from "@/lib/navigation";
import { NAV_EYEBROW_CLASSNAME } from "./navStyles";

type NavSheetProps = {
  title: string;
  /** Vira o `Dialog.Description` — o Radix associa à folha via `aria-describedby`. */
  description: string;
  vehicleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Grade de ações (folha "Registrar"): ícone + rótulo, sem estado ativo — são atalhos de criação, não lugares. */
  actions?: NavItem[];
  /** Seções agrupadas (folha "Mais"): destinos, com o atual marcado. */
  groups?: NavGroup[];
};

function SectionGroup({
  group,
  vehicleId,
  onNavigate,
}: {
  group: NavGroup;
  vehicleId: string | null;
  onNavigate: () => void;
}) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={group.label ? labelId : undefined} className="flex flex-col gap-2">
      {group.label && (
        <p id={labelId} className={NAV_EYEBROW_CLASSNAME}>
          {group.label}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {group.items.map((item) => {
          const Icon = item.icon;
          const href = resolveNavItem(item, vehicleId);
          if (!href) return null;

          return (
            <NavLink
              key={item.label}
              to={href}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-12 min-w-0 items-center gap-2.5 rounded-md border px-3 text-sm transition-colors duration-(--duration-fast)",
                  isActive
                    ? "border-border-strong bg-state-active font-semibold text-text-primary before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent"
                    : "border-border text-text-primary hover:bg-state-hover",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn("h-4 w-4 shrink-0", isActive ? "text-accent" : "text-text-secondary")}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Base da folha (bottom sheet) usada pelo botão "Registrar" e pela aba
 * "Mais" (Fase 14g) — `Dialog` do Radix posicionado na base da tela, então
 * foco preso, Escape, devolução de foco ao gatilho e título acessível vêm
 * do Radix. Etapa 01: título + descrição + fechar de 44px no topo, rolagem
 * interna (`85dvh`) e folga da safe area embaixo; "Mais" ganha os mesmos
 * grupos da sidebar e marca a seção atual.
 */
export function NavSheet({
  title,
  description,
  vehicleId,
  open,
  onOpenChange,
  actions,
  groups,
}: NavSheetProps) {
  const close = () => onOpenChange(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-lg border-t border-border bg-surface-raised px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-overlay focus:outline-none motion-safe:animate-sheet-in">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5 pt-2">
              <DialogPrimitive.Title className="text-base font-semibold text-text-primary">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-text-secondary">
                {description}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          {actions && (
            <div className="grid grid-cols-3 gap-2">
              {actions.map((item) => {
                const Icon = item.icon;
                const href = resolveNavItem(item, vehicleId);
                if (!href) return null;

                return (
                  <Link
                    key={item.label}
                    to={href}
                    onClick={close}
                    className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-md border border-border px-2 py-3 text-center text-text-primary transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-state-hover"
                  >
                    <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {groups && (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <SectionGroup
                  key={group.label ?? "sem-titulo"}
                  group={group}
                  vehicleId={vehicleId}
                  onNavigate={close}
                />
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
