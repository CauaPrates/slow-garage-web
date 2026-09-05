import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/features/auth/AuthProvider";
import { useProfile } from "@/features/auth/useProfile";
import { SignOutDialog } from "@/features/auth/components/SignOutDialog";
import { ROUTES } from "@/lib/routes";

function initialsFrom(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return initials.toUpperCase();
}

/** Foto real (`avatar_url`) > iniciais do nome de exibição > ícone genérico — nessa ordem, nunca inventando uma das duas primeiras quando falta dado. "Sair" reaproveita o `SignOutDialog` já usado em Configurações, mesma confirmação. */
export function HeaderUserMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
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
            type="button"
            aria-label="Menu do usuário"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-sm font-medium text-text-primary transition-colors duration-150 hover:border-accent"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : displayName ? (
              <span>{initialsFrom(displayName)}</span>
            ) : (
              <User className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="mb-2 flex flex-col gap-0.5 border-b border-border pb-2">
            <p className="truncate text-sm font-medium text-text-primary">
              {displayName ?? "Sem nome de exibição"}
            </p>
            <p className="truncate text-xs text-text-secondary">{user?.email}</p>
          </div>
          <Link
            to={ROUTES.configuracoes}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-text-primary transition-colors duration-150 hover:bg-bg"
          >
            <Settings className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            Configurações
          </Link>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSignOutOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-error transition-colors duration-150 hover:bg-error/10"
          >
            Sair
          </button>
        </PopoverContent>
      </Popover>

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} onConfirm={handleSignOut} />
    </>
  );
}
