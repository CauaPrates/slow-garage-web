import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Mail, Settings, ShieldCheck, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/features/auth/AuthProvider";
import { useProfile } from "@/features/auth/useProfile";
import { SignOutDialog } from "@/features/auth/components/SignOutDialog";
import { ROUTES } from "@/lib/routes";
import { initialsFrom } from "@/components/shared/UserAvatar";
import { useIsAdmin } from "@/features/admin/useIsAdmin";

const MENU_ITEM_CLASSNAME =
  "flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors duration-(--duration-fast)";

/** Foto real (`avatar_url`) > iniciais do nome de exibição > ícone genérico — nessa ordem, nunca inventando uma das duas primeiras quando falta dado. "Sair" reaproveita o `SignOutDialog` já usado em Configurações, mesma confirmação. */
export function HeaderUserMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const displayName = profile?.display_name ?? null;

  async function handleSignOut() {
    await signOut();
    navigate(ROUTES.entrar, { replace: true });
  }

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Menu do usuário"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-(--duration-fast) hover:bg-state-hover data-[state=open]:bg-state-active"
          >
            {/* Alvo de 44px com o avatar de 32px dentro — o círculo visível não precisa crescer pra cumprir o alvo de toque. */}
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-xs font-semibold text-text-primary">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : displayName ? (
                <span>{initialsFrom(displayName)}</span>
              ) : (
                <User className="h-4 w-4 text-text-secondary" aria-hidden="true" />
              )}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1.5" align="end">
          <div className="mb-1.5 flex flex-col gap-0.5 border-b border-border px-2 pt-1.5 pb-2.5">
            <p className="truncate text-sm font-medium text-text-primary">
              {displayName ?? "Sem nome de exibição"}
            </p>
            <p className="truncate text-xs text-text-secondary">{user?.email}</p>
          </div>
          <Link
            to={ROUTES.configuracoes}
            onClick={() => setMenuOpen(false)}
            className={`${MENU_ITEM_CLASSNAME} text-text-primary hover:bg-state-hover`}
          >
            <Settings className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            Configurações
          </Link>
          <Link
            to={ROUTES.meusConvites}
            onClick={() => setMenuOpen(false)}
            className={`${MENU_ITEM_CLASSNAME} text-text-primary hover:bg-state-hover`}
          >
            <Mail className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            Meus convites
          </Link>
          {/* Fase 031: só UX — quem barra de verdade é a RPC (403 `not_admin`). */}
          {isAdmin && (
            <Link
              to={ROUTES.admin}
              onClick={() => setMenuOpen(false)}
              className={`${MENU_ITEM_CLASSNAME} text-text-primary hover:bg-state-hover`}
            >
              <ShieldCheck className="h-4 w-4 text-text-secondary" aria-hidden="true" />
              Painel admin
            </Link>
          )}
          <div className="my-1.5 h-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSignOutOpen(true);
            }}
            className={`${MENU_ITEM_CLASSNAME} text-error hover:bg-error/10`}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </PopoverContent>
      </Popover>

      <SignOutDialog
        open={signOutOpen}
        onOpenChange={(open) => {
          setSignOutOpen(open);
          // O item "Sair" que abriu a confirmação some junto com o popover; sem isto o foco caía no <body> ao cancelar.
          if (!open) requestAnimationFrame(() => triggerRef.current?.focus());
        }}
        onConfirm={handleSignOut}
      />
    </>
  );
}
