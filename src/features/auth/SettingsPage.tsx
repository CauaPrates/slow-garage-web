import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

export function SettingsPage() {
  const { user, signOut } = useAuth();
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
