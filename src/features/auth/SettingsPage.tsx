import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "./AuthProvider";
import { DisplayNameForm } from "./components/DisplayNameForm";

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate(ROUTES.entrar, { replace: true });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 p-6">
      <h1 className="text-lg font-medium text-text-primary">Configurações</h1>

      <section className="flex flex-col gap-1.5">
        <p className="text-sm text-text-secondary">E-mail</p>
        <p className="text-text-primary">{user?.email}</p>
      </section>

      <section>
        <DisplayNameForm />
      </section>

      <Button variant="ghost" onClick={handleSignOut}>
        Sair
      </Button>
    </div>
  );
}
