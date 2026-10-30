import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Mail, ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/features/admin/useIsAdmin";
import { Button } from "@/components/ui/button";
import { ThemePreferenceSelect } from "@/components/shared/ThemePreferenceSelect";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { DisplayNameForm } from "./components/DisplayNameForm";
import { SignOutDialog } from "./components/SignOutDialog";

/** Divisor fino entre blocos (mesmo padrão de `FinancialSummaryCard`) em vez de 3 cards com borda/fundo próprios competindo entre si — um painel só, ficha-técnica. */
function SettingsSection({
  title,
  children,
  divider = true,
}: {
  title: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <section className={cn("flex flex-col gap-4", divider && "border-t border-border pt-4")}>
      <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function SettingsLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2.5 transition-colors duration-150 hover:border-accent"
    >
      <span className="text-text-secondary">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <span className="text-xs text-text-secondary">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
    </Link>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [signOutOpen, setSignOutOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate(ROUTES.entrar, { replace: true });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 self-start text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar
      </button>

      <h1 className="text-lg font-medium text-text-primary">Configurações</h1>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        {/* Conta: uso diário, primeiro bloco, sem divisor acima. */}
        <SettingsSection title="Conta" divider={false}>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-text-secondary">E-mail</p>
              <p className="text-text-primary">{user?.email}</p>
            </div>
            <DisplayNameForm />
          </div>
        </SettingsSection>

        {/*
          Fase 031: no mobile a bottom nav não tem lugar pro painel, e o menu
          do avatar não é onde se procura — Configurações está sempre na
          barra. "Painel admin" só pra admin (UX; quem barra é a RPC).
        */}
        <SettingsSection title={isAdmin ? "Administração" : "Convites"}>
          <div className="flex flex-col gap-2">
            {isAdmin && (
              <SettingsLink
                to={ROUTES.admin}
                icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
                title="Painel admin"
                description="Usuários, convites e log de auditoria"
              />
            )}
            <SettingsLink
              to={ROUTES.meusConvites}
              icon={<Mail className="h-5 w-5" aria-hidden="true" />}
              title="Meus convites"
              description="Convites para virar Administrador Gearhead"
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Aparência">
          <ThemePreferenceSelect />
        </SettingsSection>

        {/* Segurança + Sair: ações raras/de risco, agrupadas no mesmo bloco. */}
        <SettingsSection title="Segurança">
          <ChangePasswordForm />
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-sm text-text-secondary">Sair da conta neste dispositivo.</p>
            <Button
              type="button"
              variant="ghost"
              className="self-start border border-error/40 text-error hover:bg-error/10"
              onClick={() => setSignOutOpen(true)}
            >
              Sair
            </Button>
          </div>
        </SettingsSection>
      </div>

      <SignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={handleSignOut}
      />
    </div>
  );
}
