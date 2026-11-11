import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/features/admin/useIsAdmin";
import { Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ThemePreferenceOptions } from "@/components/shared/ThemePreferenceOptions";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "./AuthProvider";
import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { DisplayNameForm } from "./components/DisplayNameForm";
import { SignOutDialog } from "./components/SignOutDialog";

/**
 * "Voltar" volta pra tela de onde a pessoa veio (histórico, como sempre foi).
 * Etapa 14: aberta direto — link salvo, recarga, aba nova — não há tela
 * anterior no app (`idx` do React Router é 0) e o `navigate(-1)` antigo saía
 * do app (medido: `about:blank`); aí vai pra Minha garagem.
 */
function useBack() {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(ROUTES.home);
  };
}

/** Linha de atalho para outra tela (convites, painel admin): a linha toda é o link, alvo de 56px. */
function SettingsLink({ to, icon, title, description }: { to: string; icon: ReactNode; title: string; description: string }) {
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-control-touch items-center gap-3 px-(--panel-pad-x) py-2.5 transition-colors duration-(--duration-fast) hover:bg-state-hover"
      >
        <span className="text-text-secondary">{icon}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="type-item-title text-text-primary">{title}</span>
          <span className="type-caption text-text-secondary">{description}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      </Link>
    </li>
  );
}

/** Corpo do painel: o mesmo respiro lateral das linhas. `@container`: o que fica dentro se ajusta à largura do painel, não da tela. */
function PanelBody({ children }: { children: ReactNode }) {
  return <div className="@container flex flex-col gap-4 px-(--panel-pad-x) py-4">{children}</div>;
}

/**
 * Configurações — etapa 14: cabeçalho e painéis comuns (`Page`, `PageHeader`,
 * `Panel`). Cada painel diz no cabeçalho se a mudança vale na hora (tema) ou
 * depende de salvar (nome, senha). Conteúdo e regras de antes: e-mail só
 * leitura, nome (`profiles.display_name`), tema (local + `profiles.theme`),
 * senha nova (`updateUser`), atalhos de convites/admin e "Sair" com
 * confirmação.
 *
 * Uma coluna até 1280px; a partir de `xl`, duas — Perfil e Aparência à
 * esquerda, Segurança, Convites e Sessão à direita —, pra não deixar metade da
 * tela vazia nem obrigar a rolar no notebook (revisão: a coluna única de 48rem
 * deixava ~900px vazios em 1920 e rolava em 1440×900). Largura toda, como
 * as outras páginas (`Page`, ADR-099).
 */
export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const back = useBack();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const signOutFocus = useReturnFocus();

  async function handleSignOut() {
    await signOut();
    navigate(ROUTES.entrar, { replace: true });
  }

  return (
    <Page>
      <div className="flex flex-col gap-2">
        {/* Etapa 14: era 62×20px. Alvo de 44px na altura e na largura; a margem negativa alinha a seta ao título. */}
        <button
          type="button"
          onClick={back}
          className="-ml-2 inline-flex min-h-control min-w-11 items-center gap-1.5 self-start rounded-md px-2 text-sm font-medium text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </button>
        <PageHeader title="Configurações" description="Seu perfil, a aparência do app e a segurança da conta." />
      </div>

      <div className="grid grid-cols-1 gap-(--page-gap) xl:grid-cols-2 xl:items-start">
        <div className="flex min-w-0 flex-col gap-(--page-gap)">
          <Panel title="Perfil" description="O nome muda só depois de “Salvar nome”.">
            <PanelBody>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="type-label text-text-primary">E-mail</p>
                <p className="text-sm break-all text-text-primary">{user?.email}</p>
                <p className="type-caption text-text-secondary">Usado para entrar. Não é alterado por aqui.</p>
              </div>
              <DisplayNameForm />
            </PanelBody>
          </Panel>

          <Panel title="Aparência" description="Vale na hora neste aparelho e fica salva na sua conta.">
            <PanelBody>
              <ThemePreferenceOptions />
            </PanelBody>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-(--page-gap)">
          <Panel title="Segurança" description="A senha muda só depois de “Salvar nova senha”. Esta sessão continua aberta.">
            <PanelBody>
              <ChangePasswordForm />
            </PanelBody>
          </Panel>

          {/*
            Fase 031: no mobile a bottom nav não tem lugar pro painel, e o menu
            do avatar não é onde se procura — Configurações está sempre na
            barra. "Painel admin" só pra admin (UX; quem barra é a RPC).
          */}
          <Panel title={isAdmin ? "Administração" : "Convites"}>
            <ul className="flex flex-col divide-y divide-border">
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
            </ul>
          </Panel>

          {/* "Sair" fora dos painéis de edição: outra cor, outro bloco, sempre com confirmação. */}
          <Panel title="Sessão">
            <PanelBody>
              <div className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between @md:gap-6">
                <p className="text-sm text-text-secondary">
                  Sair encerra a sessão neste aparelho e nos outros em que você entrou com esta conta.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 border-error/50 text-error hover:border-error hover:bg-error/10"
                  onClick={() => {
                    signOutFocus.capture();
                    setSignOutOpen(true);
                  }}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sair da conta
                </Button>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>

      <SignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={handleSignOut}
        onCloseAutoFocus={signOutFocus.onCloseAutoFocus}
      />
    </Page>
  );
}
