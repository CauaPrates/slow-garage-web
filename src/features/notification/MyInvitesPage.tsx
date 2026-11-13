import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Page, PageHeader } from "@/components/layout/Page";
import { Alert, EmptyState, InlineError } from "@/components/ui/feedback";
import { PANEL_CLASSNAME, Panel } from "@/components/ui/panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { textLinkClassName } from "@/components/ui/text-link";
import { formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import { useIsAdmin } from "@/features/admin/useIsAdmin";
import { useMyPendingInvites } from "@/features/admin/useInvites";
import { InviteResponse } from "./InviteResponse";
import { notificationData, useNotifications } from "./useNotifications";

type PendingInvite = NonNullable<ReturnType<typeof useMyPendingInvites>["data"]>[number];

/**
 * Quem convidou não é legível pelo convidado (`admin_get_user` é só de admin);
 * o texto da notificação do convite é o único lugar que diz. Ele chega pronto
 * do banco (`private.notify`: "Renata Duarte convidou você para ser
 * Administrador Gearhead. O convite vale até 19/11/2026.") — daqui sai só o
 * nome; a validade vem do próprio convite, uma vez só. Texto em outro
 * formato (ou sem notificação): "Um administrador do Slow Garage".
 */
function inviterName(body: string | null | undefined): string | null {
  // Sem `\b`: depois de "ê" (fora de \w) não há fronteira de palavra para o regex.
  const match = body?.match(/^(.+?) convidou você(?:\s|$)/);
  return match ? match[1].trim() : null;
}

type InviteCardProps = {
  invite: PendingInvite;
  /** Nome de quem convidou, tirado da notificação do convite quando ela ainda existe. */
  inviter: string | null;
  onRespond: () => void;
  onResolved: (outcome: "accepted" | "declined") => void;
};

/**
 * Um convite. Etapa 15 (ajuste final): resumo → ações → detalhes, na tela e no
 * Tab. O resumo diz quem convidou e a validade (uma vez só; antes ela vinha no
 * cabeçalho e de novo no texto da notificação) e a frase curta do que o aceite
 * dá ("Aceitar dá acesso ao painel administrativo.", do `InviteResponse`); as
 * ações vêm logo depois — em 320×640 elas estavam a 718px, abaixo da primeira
 * tela, atrás da explicação inteira. O retorno (sucesso ou erro) aparece no
 * lugar das ações ou logo abaixo delas.
 *
 * Os detalhes vêm do que o produto faz — aceite promove a `gearhead_admin` e
 * mostra o Painel admin; o painel lista usuários, convites e o log de
 * auditoria só com cadastro e contagens (RN-7); recusar mantém a conta; nos
 * dois casos quem convidou recebe uma notificação. A partir de `@3xl` (largura
 * do painel) eles vão para a coluna da direita, como antes.
 */
function InviteCard({ invite, inviter, onRespond, onResolved }: InviteCardProps) {
  return (
    <Panel title="Convite para Administrador Gearhead" description={`Recebido em ${formatDateTime(invite.created_at)}`}>
      <div className="@container">
        <div className="grid gap-x-8 gap-y-4 px-(--panel-pad-x) py-4 @3xl:grid-cols-2 @3xl:grid-rows-[auto_1fr] @3xl:gap-y-5">
          <div className="flex flex-col gap-0.5 text-sm @3xl:col-start-1 @3xl:row-start-1">
            <p className="break-words text-text-primary">
              <span className="font-semibold">{inviter ?? "Um administrador do Slow Garage"}</span> convidou você para
              ser Administrador Gearhead.
            </p>
            <p className="text-text-secondary">Vale até {formatDateTime(invite.expires_at)}.</p>
          </div>

          <div className="@3xl:col-start-1 @3xl:row-start-2 @3xl:self-start">
            <InviteResponse inviteId={invite.id} onRespond={onRespond} onResolved={onResolved} compact />
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-text-secondary @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1 @3xl:border-t-0 @3xl:border-l @3xl:pt-0 @3xl:pl-8">
            <div className="flex flex-col gap-1">
              <h3 className="type-section-title text-text-primary">Se você aceitar</h3>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                <li>O Painel admin aparece no menu do perfil e em Configurações.</li>
                <li>Nele você vê usuários, convites e o log de auditoria — cadastro e contagens, nunca o conteúdo das garagens.</li>
                <li>Você passa a poder convidar e remover administradores.</li>
              </ul>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="type-section-title text-text-primary">Se você recusar</h3>
              <p>Nada muda na sua conta. Para aceitar depois, só com um convite novo.</p>
            </div>
            <p>Nos dois casos seus veículos e registros não mudam, e quem convidou recebe um aviso com a resposta.</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/**
 * "Meus convites": os convites para Administrador Gearhead pendentes e ainda
 * válidos que a pessoa logada recebeu — caminho de volta pra quem apagou a
 * notificação. O e-mail do convite não tem link de aceite; o aceite é
 * sempre aqui ou pela notificação, logado. Rota protegida: sem sessão, o
 * login leva de volta pra cá (`?redirect=/convites`).
 *
 * Etapa 15: página no padrão comum (`Page`, `PageHeader`, `Panel`, estados
 * com componente). O cartão respondido continua na tela com o resultado —
 * antes ele saía da lista de pendentes na hora e o retorno (sucesso ou o
 * erro de um convite que venceu no meio do caminho) sumia junto.
 */
export function MyInvitesPage() {
  const invitesQuery = useMyPendingInvites();
  // O texto da notificação do convite diz quem convidou; a lista já vem carregada pelo cabeçalho.
  const notificationsQuery = useNotifications();
  const { data: isAdmin } = useIsAdmin();
  const [kept, setKept] = useState<PendingInvite[]>([]);
  const [acceptedHere, setAcceptedHere] = useState(false);
  // Depois de "Tentar de novo", o foco vai para o bloco que carregou (antes caía no <body>).
  const contentRef = useRef<HTMLDivElement>(null);
  const retry = useRetryFocus(invitesQuery.dataUpdatedAt, contentRef);

  const pending = invitesQuery.data ?? [];
  const invites = [...pending, ...kept.filter((k) => !pending.some((p) => p.id === k.id))].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  function inviterOf(inviteId: string) {
    const notification = notificationsQuery.data?.find(
      (n) => n.type === "admin_invite_received" && notificationData(n).invite_id === inviteId,
    );
    return inviterName(notification?.body);
  }

  function keep(invite: PendingInvite) {
    setKept((current) => (current.some((k) => k.id === invite.id) ? current : [...current, invite]));
  }

  return (
    <Page>
      <PageHeader
        title="Meus convites"
        description="Convites para virar Administrador Gearhead."
      />

      {isAdmin && !acceptedHere && (
        <Alert
          tone="success"
          role="status"
          action={
            <Link to={ROUTES.admin} className={cn(textLinkClassName("sm"), "shrink-0")}>
              Ir para o painel
            </Link>
          }
        >
          <p className="text-text-primary">Você é Administrador Gearhead.</p>
        </Alert>
      )}

      <div ref={contentRef} tabIndex={-1} className="flex flex-col gap-(--page-gap) outline-none">
        {invitesQuery.isLoading && (
          <section className={PANEL_CLASSNAME}>
            <SkeletonList label="Carregando seus convites…" rows={2} />
          </section>
        )}

        {invitesQuery.isError && invites.length === 0 && (
          <section className={PANEL_CLASSNAME}>
            <InlineError onRetry={() => retry(invitesQuery.refetch)}>Não foi possível carregar seus convites.</InlineError>
          </section>
        )}

        {invitesQuery.data && invites.length === 0 && (
          <EmptyState icon={Mail} title="Nenhum convite pendente">
            Quando um administrador convidar você, o convite aparece aqui e nas suas notificações. Cada convite vale
            por 7 dias.
          </EmptyState>
        )}

        {invites.map((invite) => (
          <InviteCard
            key={invite.id}
            invite={invite}
            inviter={inviterOf(invite.id)}
            onRespond={() => keep(invite)}
            onResolved={(outcome) => {
              if (outcome === "accepted") setAcceptedHere(true);
            }}
          />
        ))}
      </div>
    </Page>
  );
}
