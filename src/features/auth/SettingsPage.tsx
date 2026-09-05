import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemePreferenceSelect } from "@/components/shared/ThemePreferenceSelect";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { DisplayNameForm } from "./components/DisplayNameForm";

function SettingsSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface p-4",
        className,
      )}
    >
      <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SettingsSection title="Conta" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <SettingsSection title="Segurança">
          <ChangePasswordForm />
        </SettingsSection>
      </div>

      <Button variant="ghost" className="self-start" onClick={handleSignOut}>
        Sair
      </Button>
    </div>
  );
}
