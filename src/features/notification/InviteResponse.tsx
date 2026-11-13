import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, InlineError } from "@/components/ui/feedback";
import { SkeletonList } from "@/components/ui/skeleton";
import { textLinkClassName } from "@/components/ui/text-link";
import { formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useRetryFocus } from "@/hooks/useRetryFocus";
import { translateAdminError } from "@/features/admin/errors";
import { useIsAdmin } from "@/features/admin/useIsAdmin";
import {
  INVITE_STATUS_LABELS,
  effectiveInviteStatus,
  useAcceptInvite,
  useDeclineInvite,
  useInvite,
  type AdminInviteStatus,
} from "@/features/admin/useInvites";

type Outcome = "accepted" | "declined";

type InviteResponseProps = {
  inviteId: string | undefined;
  /** Chamado depois de aceitar ou recusar com sucesso (ex.: marcar a notificação como lida). */
  onResolved?: (outcome: Outcome) => void;
  /** Chamado no primeiro clique em Aceitar/Recusar — "Meus convites" guarda o cartão na tela mesmo se ele sair da lista de pendentes. */
  onRespond?: () => void;
  /** Chamado ao seguir o link pro painel (ex.: fechar o popover). */
  onNavigate?: () => void;
  /** Na notificação: o texto dela já diz quem convidou e até quando vale — aqui ficam só as ações e a situação. */
  compact?: boolean;
};

/** Situação que não é mais "pendente": selo (texto + tom) e a frase do que aconteceu. */
const SETTLED: Record<Exclude<AdminInviteStatus, "pending">, { tone: BadgeTone; text: (expiresAt: string) => string }> = {
  accepted: { tone: "success", text: () => "Você aceitou este convite." },
  declined: { tone: "neutral", text: () => "Você recusou este convite." },
  revoked: { tone: "dashed", text: () => "Um administrador cancelou este convite antes da resposta." },
  expired: { tone: "dashed", text: (expiresAt) => `Venceu em ${formatDateTime(expiresAt)} sem resposta.` },
};

const PANEL_LINK = cn(textLinkClassName("sm"), "-ml-1 shrink-0");

/**
 * Aceitar/Recusar um convite para Administrador Gearhead. Confere o convite
 * no banco antes de mostrar os botões: a notificação continua existindo
 * depois que o convite é cancelado ou expira, e `pending` com `expires_at`
 * vencido conta como expirado (ver `effectiveInviteStatus`).
 *
 * Etapa 15:
 * - Segundo acionamento ignorado por trava em `ref` (dois cliques no mesmo
 *   quadro chamavam a RPC duas vezes) e botões `aria-disabled` durante o
 *   envio — o foco fica no botão (com `disabled` ele caía no `<body>`).
 * - O resultado fica na tela e recebe o foco: "Convite aceito…" com o link
 *   do painel, ou "Convite recusado…". Antes, em "Meus convites", o cartão
 *   sumia da lista de pendentes e não sobrava nada (nem o erro, quando o
 *   convite tinha vencido ou sido cancelado no meio do caminho).
 * - Recusado pelo banco: a mensagem do `hint` num aviso de erro; se a
 *   situação do convite mudou (vencido, cancelado), a frase da situação toma
 *   o lugar dos botões e recebe o foco.
 */
export function InviteResponse({ inviteId, onResolved, onRespond, onNavigate, compact = false }: InviteResponseProps) {
  const inviteQuery = useInvite(inviteId);
  const { data: isAdmin } = useIsAdmin();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();
  const running = useRef(false);
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempted, setAttempted] = useState(false);
  // O bloco à vista (resultado, situação, ações): recebe o foco depois de responder ou de "Tentar de novo".
  const bodyRef = useRef<HTMLDivElement>(null);
  const retry = useRetryFocus(inviteQuery.dataUpdatedAt, bodyRef);

  const invite = inviteQuery.data;
  const status = invite ? effectiveInviteStatus(invite) : null;
  const settled = !outcome && attempted && status !== null && status !== "pending";

  // O resultado (ou a situação nova, depois de uma recusa do banco) substitui os botões: o foco vai junto.
  useEffect(() => {
    if (outcome || settled) bodyRef.current?.focus();
  }, [outcome, settled]);

  if (!inviteId) return null;

  async function respond(action: "accept" | "decline") {
    if (!invite || running.current) return;
    running.current = true;
    setPending(action);
    setError(null);
    setAttempted(true);
    onRespond?.();
    try {
      await (action === "accept" ? accept : decline).mutateAsync(invite.id);
      const result: Outcome = action === "accept" ? "accepted" : "declined";
      setOutcome(result);
      onResolved?.(result);
    } catch (mutationError) {
      setError(translateAdminError(mutationError));
    } finally {
      running.current = false;
      setPending(null);
    }
  }

  if (outcome) {
    return (
      <div ref={bodyRef} tabIndex={-1} className="rounded-lg outline-offset-2">
        <Alert
          tone={outcome === "accepted" ? "success" : "info"}
          role="status"
          action={
            outcome === "accepted" && isAdmin ? (
              <Link to={ROUTES.admin} onClick={onNavigate} className={PANEL_LINK}>
                Ir para o painel
              </Link>
            ) : undefined
          }
        >
          {outcome === "accepted" ? (
            <>
              <p className="font-medium text-text-primary">Convite aceito.</p>
              <p className="text-text-secondary">Agora você é Administrador Gearhead.</p>
            </>
          ) : (
            <>
              <p className="font-medium text-text-primary">Convite recusado.</p>
              <p className="text-text-secondary">Sua conta continua como estava, sem acesso ao painel.</p>
            </>
          )}
        </Alert>
      </div>
    );
  }

  if (inviteQuery.isLoading) {
    return <SkeletonList label="Conferindo o convite…" rows={1} className="max-w-60 p-0" />;
  }

  if (inviteQuery.isError) {
    return (
      <InlineError onRetry={() => retry(inviteQuery.refetch)} className="p-0">
        Não foi possível conferir o convite.
      </InlineError>
    );
  }

  if (!invite || !status) {
    return (
      <div ref={bodyRef} tabIndex={-1} className="rounded-md outline-offset-2">
        <p className="text-sm text-text-secondary">Este convite não está mais disponível.</p>
      </div>
    );
  }

  if (status !== "pending") {
    const { tone, text } = SETTLED[status];
    return (
      <div
        ref={bodyRef}
        tabIndex={-1}
        role={settled ? "status" : undefined}
        className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md outline-offset-2"
      >
        <Badge tone={tone}>{INVITE_STATUS_LABELS[status]}</Badge>
        <span className="text-sm text-text-secondary">{text(invite.expires_at)}</span>
        {status === "accepted" && isAdmin && (
          <Link to={ROUTES.admin} onClick={onNavigate} className={PANEL_LINK}>
            Ir para o painel
          </Link>
        )}
      </div>
    );
  }

  return (
    <div ref={bodyRef} tabIndex={-1} className="flex flex-col gap-2 rounded-md outline-offset-2">
      {compact && <p className="text-sm text-text-secondary">Aceitar dá acesso ao painel administrativo.</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          aria-disabled={pending !== null || undefined}
          onClick={() => respond("accept")}
        >
          {pending === "accept" && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
          {pending === "accept" ? "Aceitando…" : "Aceitar convite"}
        </Button>
        <Button
          variant="outline"
          aria-disabled={pending !== null || undefined}
          onClick={() => respond("decline")}
        >
          {pending === "decline" && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
          {pending === "decline" ? "Recusando…" : "Recusar"}
        </Button>
      </div>
      {error && (
        <Alert tone="error" role="alert">
          <p className="text-text-primary">{error}</p>
        </Alert>
      )}
    </div>
  );
}
