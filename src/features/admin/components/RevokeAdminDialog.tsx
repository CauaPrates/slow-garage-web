import { useRef, useState, type MouseEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRecord,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldError } from "@/components/ui/field-error";
import { useReturnFocus } from "@/hooks/useReturnFocus";
import { formatDateTime } from "@/lib/format";
import { translateAdminError } from "../errors";
import { useRevokeAdminRole, type AdminUserDetail } from "../useAdmin";

type RevokeAdminDialogProps = {
  /** O administrador como estava quando a confirmação abriu — o cartão não muda enquanto a lista recarrega. */
  user: AdminUserDetail;
  isSelf: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevoked: () => void;
  /**
   * Para onde o foco vai quando o controle que abriu a confirmação já não está
   * na tela (depois do sucesso o "Remover admin" some: a pessoa virou
   * Gearhead). Um ponto estável do contexto — o retorno da ação ou o painel.
   */
  focusFallback: () => HTMLElement | null;
};

/**
 * Confirmação de `admin_revoke_admin_role`. Pode ser o próprio usuário:
 * nesse caso o recheck de `is_admin` (feito pela mutation) tira a pessoa
 * do painel logo depois. O último admin é recusado pelo banco
 * (`last_admin`) e a mensagem aparece aqui, sem fechar o diálogo.
 *
 * Etapa 16:
 * - **Foco ao fechar** (pendência da ADR-099): o diálogo é aberto por estado,
 *   sem `AlertDialogTrigger`, e o Radix devolvia o foco a um gatilho que não
 *   existe — caía no `<body>`. Agora usa o `useReturnFocus` dos diálogos das
 *   etapas 05–15: guarda o controle focado ao abrir e o devolve, com o anel
 *   visível, ao cancelar pelo botão, por Enter ou por Escape. Se ele saiu da
 *   tela, `focusFallback`. "Cancelar" continua sendo o foco inicial (padrão do
 *   `AlertDialog` do Radix).
 * - **O efeito real**, conferido na migration do painel: o papel volta a
 *   Gearhead na hora (`user_roles`), toda RPC do painel passa a recusar a
 *   pessoa, ela recebe a notificação `admin_role_revoked` e o evento
 *   `role_changed` entra no log; veículos e registros não mudam; voltar só com
 *   convite novo.
 * - **Envio**: trava em `ref` (cliques e Enter repetidos → uma RPC) e
 *   `aria-disabled` com "Removendo…" — com `disabled` o foco caía no `<body>`
 *   durante o envio. Fechar fica bloqueado até a resposta. Na falha, o foco
 *   fica no botão e o erro é anunciado.
 */
export function RevokeAdminDialog({ user, isSelf, open, onOpenChange, onRevoked, focusFallback }: RevokeAdminDialogProps) {
  const revoke = useRevokeAdminRole();
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const returnFocus = useReturnFocus({ visible: true });
  const name = user.display_name?.trim() || null;

  function handleOpenChange(next: boolean) {
    if (!next && sendingRef.current) return;
    if (!next) setError(null);
    onOpenChange(next);
  }

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    try {
      await revoke.mutateAsync(user.user_id);
      sendingRef.current = false;
      onRevoked();
      handleOpenChange(false);
    } catch (mutationError) {
      setError(translateAdminError(mutationError));
    } finally {
      sendingRef.current = false;
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        onOpenAutoFocus={returnFocus.capture}
        onCloseAutoFocus={(event) => {
          returnFocus.onCloseAutoFocus(event);
          if (event.defaultPrevented) return;
          const fallback = focusFallback();
          if (fallback) {
            event.preventDefault();
            fallback.focus({ focusVisible: true });
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{isSelf ? "Deixar de ser administrador?" : "Remover dos administradores?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isSelf ? "Você volta a ser Gearhead assim que confirmar." : "A pessoa volta a ser Gearhead na hora."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogRecord>
          <p className="text-sm font-medium wrap-anywhere text-text-primary">{name ?? user.email}</p>
          {name && <p className="text-xs wrap-anywhere text-text-secondary">{user.email}</p>}
          <p className="text-xs text-text-secondary">
            Administrador Gearhead{user.granted_at ? ` desde ${formatDateTime(user.granted_at)}` : ""}
            {isSelf && " · você"}
          </p>
        </AlertDialogRecord>

        {/* Duas linhas curtas: em 320×640, com e-mail longo no cartão, a confirmação inteira (e os dois botões) cabe sem rolar. */}
        <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-text-secondary">
          {isSelf ? (
            <>
              <li>O painel sai do seu menu; você recebe uma notificação e a mudança entra no log de auditoria.</li>
              <li>Seus veículos e registros não mudam. Para voltar, outro administrador precisa te convidar.</li>
            </>
          ) : (
            <>
              <li>O painel deixa de abrir para ela; ela recebe uma notificação e a mudança entra no log de auditoria.</li>
              <li>Veículos e registros não mudam. Para voltar, só com um convite novo.</li>
            </>
          )}
        </ul>

        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}

        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} aria-disabled={revoke.isPending || undefined}>
            {revoke.isPending && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
            {revoke.isPending ? "Removendo…" : isSelf ? "Deixar de ser admin" : "Remover admin"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
