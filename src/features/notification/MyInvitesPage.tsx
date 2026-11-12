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

/** Quem convidou não é legível pelo convidado (`admin_get_user` é só de admin); o texto da notificação do convite é o único lugar que diz. */
const INVITER_FALLBACK = "Um administrador do Slow Garage convidou você para ser Administrador Gearhead.";

type InviteCardProps = {
  invite: PendingInvite;
  /** Texto da notificação do convite ("Renata Duarte convidou você…"), quando ela ainda existe. */
  inviterSentence: string | null;
  onRespond: () => void;
  onResolved: (outcome: "accepted" | "declined") => void;
};

/**
 * Um convite: quem convidou e até quando vale, o que muda em cada resposta e
 * as duas ações. O que muda vem do que o produto faz — aceite promove a
 * `gearhead_admin` e mostra o Painel admin; o painel lista usuários, convites
 * e o log de auditoria só com cadastro e contagens (RN-7); recusar mantém a
 * conta; nos dois casos quem convidou recebe uma notificação.
 *
 * Ordem de leitura e de Tab: quem convidou → o que muda → ações. A partir de
 * `@3xl` (largura do painel) o que muda vai para a coluna da direita e as
 * ações ficam sob o convite.
 */
function InviteCard({ invite, inviterSentence, onRespond, onResolved }: InviteCardProps) {
  return (
    <Panel
      title="Convite para Administrador Gearhead"
      description={`Recebido em ${formatDateTime(invite.created_at)} · vale até ${formatDateTime(invite.expires_at)}`}
    >
      <div className="@container">
        <div className="grid gap-x-8 gap-y-5 px-(--panel-pad-x) py-4 @3xl:grid-cols-2 @3xl:grid-rows-[auto_1fr]">
          <p className="text-sm break-words text-text-primary @3xl:col-start-1 @3xl:row-start-1">
            {inviterSentence ?? INVITER_FALLBACK}
          </p>

          <div className="flex flex-col gap-3 text-sm text-text-secondary @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1 @3xl:border-l @3xl:border-border @3xl:pl-8">
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

          <div className="@3xl:col-start-1 @3xl:row-start-2 @3xl:self-start">
            <InviteResponse inviteId={invite.id} onRespond={onRespond} onResolved={onResolved} />
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

  function inviterSentence(inviteId: string) {
    const notification = notificationsQuery.data?.find(
      (n) => n.type === "admin_invite_received" && notificationData(n).invite_id === inviteId,
    );
    return notification?.body?.trim() ? notification.body : null;
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
            inviterSentence={inviterSentence(invite.id)}
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
