import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { curlFrame, easeTurn } from "./magazine/curl";
import { PAGES } from "./magazine/pages";

type Turn = { from: number; to: number; dir: "next" | "prev" };

/** Uma virada inteira, pelo botão ou pelo avanço automático. */
const TURN_MS = 1400;
/** Tempo parado em cada página antes de virar sozinha. */
const AUTOPLAY_MS = 7000;
/** Arrasto mínimo (px) para começar a virar — abaixo disso é só um toque. */
const DRAG_START_PX = 8;
/** Soltando a folha depois desta fração da virada, ela termina de virar; antes, volta para o lugar. */
const DRAG_COMMIT = 0.3;

const decoded = new Map<string, Promise<void>>();
/** Baixa e decodifica uma foto antes de ela aparecer — a virada nunca revela uma página em branco. */
function prepare(src: string): Promise<void> {
  let ready = decoded.get(src);
  if (!ready) {
    const image = new Image();
    image.src = src;
    ready = image.decode().catch(() => undefined);
    decoded.set(src, ready);
  }
  return ready;
}
const preparePage = (index: number) => Promise.all(PAGES[index].images.map(prepare));

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export type LoginMagazineProps = {
  /**
   * `panel` (padrão): a coluna editorial do desktop, com controles e arrasto.
   * `background`: abaixo de `lg`, o fundo da tela inteira, escurecido, só
   * com o carrossel e um botão de pausa no canto — decorativo para leitor de
   * tela.
   */
  variant?: "panel" | "background";
};

/**
 * Revista folheável do login desktop (ADR-104). A revista é a superfície do
 * painel: uma página por vez, de borda a borda, rediagramada para a proporção
 * da coluna (`magazine/pages.tsx`).
 *
 * Três jeitos de virar:
 * - sozinha, a cada 7 s, como um carrossel (da última volta para a capa);
 *   para enquanto o ponteiro está sobre a revista, o foco está nos controles
 *   ou a aba está escondida, e tem botão de pausar (WCAG 2.2.2). Com
 *   movimento reduzido começa pausada;
 * - pelos botões (e setas do teclado com o foco neles);
 * - arrastando a folha: pra esquerda avança, pra direita volta; soltando
 *   antes de 30% da virada, ela volta para o lugar.
 *
 * "Próxima" levanta o canto inferior direito, a ponta curva mostrando o verso
 * marfim e deixando sombra na página seguinte (`magazine/curl.ts`); voltar
 * faz o caminho inverso. A animação roda só durante a virada (nenhum laço
 * parado) e escreve direto nos estilos, sem re-render por quadro. Com
 * movimento reduzido, a troca é imediata.
 *
 * A página é decorativa para leitor de tela (`aria-hidden`): quem lê é a
 * descrição em português e o aviso "Página N de 5, título" — calado enquanto
 * a revista vira sozinha, para não interromper o formulário ao lado.
 *
 * Quem monta é o `useAuthMagazine` (telas de entrada), por `lazy` (o código e as fotos chegam depois
 * do formulário): `panel` a partir de `lg`, `background` abaixo disso.
 */
export function LoginMagazine({ variant = "panel" }: LoginMagazineProps) {
  const isPanel = variant === "panel";
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [playing, setPlaying] = useState(!reducedMotion);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(() => document.hidden);

  const busy = useRef(false);
  /** O que fazer quando a folha montar: animar sozinha ou seguir o ponteiro. */
  const mode = useRef<"auto" | "drag">("auto");
  const progress = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);
  const drag = useRef<{ x: number; id: number; dir: Turn["dir"] | null } | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const castRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);

  // A capa vai primeiro (prioridade alta nas fotos dela); as vizinhas são preparadas depois, para a próxima virada.
  useEffect(() => {
    for (const neighbor of [index + 1, index - 1, 0]) {
      if (PAGES[neighbor]) void preparePage(neighbor);
    }
  }, [index]);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current ?? 0), []);

  // Ponteiro sobre a revista (pausa o carrossel). Pelo movimento na janela, não por enter/leave: a virada troca a folha
  // que está sob o ponteiro, e o navegador não avisa a saída de um nó removido — a pausa ficava presa.
  useEffect(() => {
    if (!isPanel) return;
    const onMove = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "mouse") setHovered(!!sectionRef.current?.contains(event.target as Node));
    };
    const onLeaveWindow = () => setHovered(false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
    };
  }, [isPanel]);

  const draw = useCallback((value: number) => {
    progress.current = value;
    const book = bookRef.current;
    const top = topRef.current;
    const cast = castRef.current;
    const flap = flapRef.current;
    if (!book || !top || !cast || !flap) return;
    const frame = curlFrame(book.clientWidth, book.clientHeight, value);
    top.style.clipPath = frame.front;
    cast.style.clipPath = frame.lifted;
    cast.style.backgroundImage = frame.cast;
    flap.style.clipPath = frame.lifted;
    flap.style.transform = frame.flap;
    flap.style.backgroundImage = frame.flapShade;
  }, []);

  /** Leva a folha de onde está até `target` (0 = no lugar, 1 = virada) e chama `done` no fim. */
  const animate = useCallback(
    (target: number, duration: number, done: () => void) => {
      cancelAnimationFrame(frameRef.current ?? 0);
      const origin = progress.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
        draw(origin + (target - origin) * easeTurn(t));
        if (t < 1) frameRef.current = requestAnimationFrame(step);
        else done();
      };
      frameRef.current = requestAnimationFrame(step);
    },
    [draw],
  );

  const settle = useCallback((next: number | null) => {
    if (next !== null) setIndex(next);
    setTurn(null);
    busy.current = false;
  }, []);

  // Primeiro quadro antes da pintura (voltando, a página anterior não pode aparecer inteira nem por um instante).
  useLayoutEffect(() => {
    if (!turn) return;
    draw(turn.dir === "next" ? 0 : 1);
    if (mode.current === "auto") {
      animate(turn.dir === "next" ? 1 : 0, TURN_MS, () => settle(turn.to));
    }
    return () => cancelAnimationFrame(frameRef.current ?? 0);
  }, [turn, draw, animate, settle]);

  const go = useCallback(
    async (dir: Turn["dir"], { wrap = false } = {}) => {
      let to = dir === "next" ? index + 1 : index - 1;
      if (wrap && to >= PAGES.length) to = 0;
      if (busy.current || to < 0 || to >= PAGES.length) return;
      busy.current = true;
      if (reducedMotion) {
        settle(to);
        return;
      }
      await preparePage(to);
      mode.current = "auto";
      setTurn({ from: index, to, dir });
    },
    [index, reducedMotion, settle],
  );

  // Carrossel: depois de 7 s parada numa página, vira sozinha. Qualquer virada (botão, arrasto) recomeça a contagem.
  const autoplay = playing && !pageHidden && (!isPanel || (!hovered && !focused));
  useEffect(() => {
    if (!autoplay || turn) return;
    const timer = window.setTimeout(() => void go("next", { wrap: true }), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, turn, go]);

  /** Setas também viram a página quando o foco está num dos botões. */
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      void go("next");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      void go("prev");
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (busy.current || event.button !== 0) return;
    drag.current = { x: event.clientX, id: event.pointerId, dir: null };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    const book = bookRef.current;
    if (!current || current.id !== event.pointerId || !book) return;
    const dx = event.clientX - current.x;
    if (!current.dir) {
      if (Math.abs(dx) < DRAG_START_PX) return;
      const dir = dx < 0 ? "next" : "prev";
      const to = dir === "next" ? index + 1 : index - 1;
      if (busy.current || to < 0 || to >= PAGES.length || reducedMotion) {
        drag.current = null;
        return;
      }
      current.dir = dir;
      busy.current = true;
      mode.current = "drag";
      book.setPointerCapture(event.pointerId);
      void preparePage(to);
      setTurn({ from: index, to, dir });
      return;
    }
    // A folha acompanha o ponteiro: uma largura de página arrastada é a virada inteira.
    const travel = clamp01(Math.abs(dx) / book.clientWidth);
    const value = current.dir === "next" ? (dx < 0 ? travel : 0) : dx > 0 ? 1 - travel : 1;
    cancelAnimationFrame(frameRef.current ?? 0);
    frameRef.current = requestAnimationFrame(() => draw(value));
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (!current.dir || !turn) return;
    const done = current.dir === "next" ? progress.current : 1 - progress.current;
    const commit = event.type === "pointerup" && done >= DRAG_COMMIT;
    const target = current.dir === "next" ? (commit ? 1 : 0) : commit ? 0 : 1;
    const remaining = commit ? 1 - done : done;
    const to = turn.to;
    animate(target, Math.max(220, TURN_MS * remaining), () => settle(commit ? to : null));
  }

  // Avançando, a página nova fica por baixo e a atual vira por cima; voltando, a atual fica por baixo e a anterior volta por cima.
  const under = turn ? (turn.dir === "next" ? turn.to : turn.from) : null;
  const top = turn ? (turn.dir === "next" ? turn.from : turn.to) : index;
  const current = PAGES[index];
  const atStart = index === 0;
  const atEnd = index === PAGES.length - 1;

  const book = (
    <div
      ref={bookRef}
      aria-hidden="true"
      className="magazine__book"
      data-page={index + 1}
      onPointerDown={isPanel ? onPointerDown : undefined}
      onPointerMove={isPanel ? onPointerMove : undefined}
      onPointerUp={isPanel ? onPointerEnd : undefined}
      onPointerCancel={isPanel ? onPointerEnd : undefined}
    >
      {under !== null && (
        <div key={`under-${under}`} className="magazine__sheet">
          {PAGES[under].content}
        </div>
      )}
      {turn && <div ref={castRef} className="magazine__cast" />}
      <div key={`top-${top}`} ref={topRef} className="magazine__sheet magazine__sheet--top">
        {PAGES[top].content}
      </div>
      {turn && (
        <div className="magazine__flap-shadow">
          <div ref={flapRef} className="magazine__flap" />
        </div>
      )}
    </div>
  );

  if (!isPanel) {
    return (
      <>
        <div aria-hidden="true" className="magazine magazine--background">
          {book}
        </div>
        {/* Fora do fundo (portal): acima do cartão do formulário, no canto livre do topo. */}
        {createPortal(
          <button
            type="button"
            className="magazine__control magazine__backdrop-toggle"
            aria-label={playing ? "Pausar a revista do fundo" : "Virar as páginas do fundo"}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          </button>,
          document.body,
        )}
      </>
    );
  }

  return (
    <section
      aria-roledescription="revista"
      aria-label="Revista Slow Garage, Edição 01"
      className="magazine"
      ref={sectionRef}
    >
      {/* Arrastar é atalho de mouse e toque; os botões fazem o mesmo para teclado e leitor de tela. */}
      {book}

      <p className="sr-only">{current.description}</p>

      {/* Sobre a faixa de rodapé que toda página reserva — nunca em cima de foto ou texto. */}
      <div
        className="magazine__controls"
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        <button
          type="button"
          className="magazine__control"
          aria-label="Página anterior"
          aria-disabled={atStart || undefined}
          onClick={() => void go("prev")}
          onKeyDown={onKeyDown}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p aria-hidden="true" className="magazine__position">
          {index + 1} de {PAGES.length}
        </p>
        <button
          type="button"
          className="magazine__control"
          aria-label="Próxima página"
          aria-disabled={atEnd || undefined}
          onClick={() => void go("next")}
          onKeyDown={onKeyDown}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <span aria-hidden="true" className="magazine__divider" />
        <button
          type="button"
          className="magazine__control"
          aria-label={playing ? "Pausar a revista" : "Virar as páginas sozinha"}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <p aria-live={autoplay ? "off" : "polite"} className="sr-only">
        Página {index + 1} de {PAGES.length}, {current.title}
      </p>
    </section>
  );
}

export default LoginMagazine;
