import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";

/** Estado de navegação que leva um aviso pra próxima tela (ex.: `AdminRoute` tirando do painel quem perdeu o acesso). */
export type RouteNoticeState = { notice?: string };

/**
 * Faixa de aviso vinda de um redirecionamento — o motivo de a pessoa ter
 * sido levada pra cá. Vive no `location.state`, então some sozinha ao
 * navegar e não volta num reload. Fechar limpa o state da entrada atual.
 *
 * Etapa 17 — **foco na chegada**. O redirecionamento desmonta o controle que
 * estava focado (ex.: a autorremoção no Admin) e o foco caía no `<body>`.
 * Agora, uma vez por navegação (`location.key`), o texto do aviso recebe o
 * foco: é um destino estável (fica até fechar ou navegar) e, focado, é lido
 * por inteiro. `tabIndex={-1}`: alvo só do código, nunca uma parada de Tab —
 * o Tab seguinte vai para "Fechar aviso" e daí para a página. Sem rolagem
 * automática (`preventScroll`); só rola quando o aviso ficou fora da tela,
 * porque o documento do celular mantém a rolagem da rota anterior.
 * `setTimeout(0)`: roda depois do retorno de foco de um diálogo que fechou na
 * mesma troca de rota. Se o foco já estiver dentro de um diálogo ou menu
 * aberto, não é roubado. "Fechar aviso" leva o foco ao título da página.
 */
export function RouteNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const notice = (location.state as RouteNoticeState | null)?.notice;
  const messageRef = useRef<HTMLParagraphElement>(null);
  const focusedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!notice || focusedKey.current === location.key) return;
    const timer = window.setTimeout(() => {
      const message = messageRef.current;
      if (!message?.isConnected) return;
      // Marca aqui (e não antes do timer): no StrictMode o efeito monta duas vezes e o primeiro timer é cancelado.
      focusedKey.current = location.key;
      const active = document.activeElement;
      if (active && active !== document.body && active.closest('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;
      message.focus({ preventScroll: true, focusVisible: true });
      const rect = message.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) message.scrollIntoView({ block: "center" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [notice, location.key]);

  /** Fechar some com o próprio botão: o foco vai para o título da página (ou o `<main>`), não para o `<body>`. */
  function close() {
    const main = messageRef.current?.closest("main") ?? null;
    navigate(location.pathname + location.search, { replace: true, state: null });
    window.requestAnimationFrame(() => {
      const target = main?.querySelector<HTMLElement>("h1") ?? main;
      if (!target?.isConnected) return;
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
      target.focus({ preventScroll: true });
    });
  }

  if (!notice) return null;

  return (
    // Harmonização 01: o aviso comum (`Alert`), com a margem da página.
    <Alert
      tone="warning"
      role="status"
      className="mx-(--page-gutter) mt-4 flex-row items-center py-1 pr-1"
      action={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar aviso"
          onClick={close}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      }
    >
      <p ref={messageRef} tabIndex={-1} className="rounded-sm text-text-primary outline-offset-2">
        {notice}
      </p>
    </Alert>
  );
}
