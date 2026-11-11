import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import cover from "@/assets/magazine/01-capa.webp";
import meetingOpening from "@/assets/magazine/02-encontro-noturno.webp";
import meetingDetails from "@/assets/magazine/03-encontro-noturno.webp";
import workshopOpening from "@/assets/magazine/04-um-dia-na-oficina.webp";
import workshopDetails from "@/assets/magazine/05-um-dia-na-oficina.webp";

type MagazinePage = {
  src: string;
  /** Nome curto da página, lido como "Página 3 de 5, Encontro noturno — detalhes". */
  title: string;
  /** O que a arte mostra — o texto em japonês faz parte da arte e não é traduzido aqui. */
  alt: string;
};

/**
 * Edição 01 — artes finais fornecidas pelo usuário (11/11/2026), 3:4, em WebP
 * na resolução original (qualidade 90; legendas conferidas contra o PNG).
 */
const PAGES: MagazinePage[] = [
  {
    src: cover,
    title: "Capa",
    alt: "Capa da revista Slow Garage, Edição 01: cupê branco numa oficina e as chamadas do encontro noturno e do dia na oficina.",
  },
  {
    src: meetingOpening,
    title: "Encontro noturno — abertura",
    alt: "Abertura da matéria Encontro noturno: um hatch vermelho e um cupê verde num estacionamento à noite.",
  },
  {
    src: meetingDetails,
    title: "Encontro noturno — detalhes",
    alt: "Encontro noturno: cupê verde sob um viaduto, carros reunidos com o cupê branco da garagem e o painel de um carro.",
  },
  {
    src: workshopOpening,
    title: "Um dia na oficina — abertura",
    alt: "Abertura da matéria Um dia na oficina: mãos organizando chaves numa bancada de ferramentas.",
  },
  {
    src: workshopDetails,
    title: "Um dia na oficina — detalhes",
    alt: "Um dia na oficina: mola e amortecedor, instrumentos do painel e um caderno de anotações.",
  },
];

type Turn = { from: number; to: number; dir: "next" | "prev" };

/** Margem pra o `animationend` que não chega (aba em segundo plano, animação cortada): a virada nunca fica presa. */
const TURN_FALLBACK_MS = 900;

const decoded = new Map<string, Promise<void>>();
/** Baixa e decodifica a página antes de ela aparecer — a virada nunca revela uma página em branco. */
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

/**
 * Revista folheável do login desktop (ADR-104). Uma página 3:4 por vez, na
 * mesma moldura; "Próxima página" vira a atual pela borda esquerda e revela a
 * seguinte por baixo, "Página anterior" traz a anterior de volta (o movimento
 * inverso). Cliques durante a virada são ignorados — nada se sobrepõe nem
 * pula página. Com movimento reduzido, troca na hora.
 *
 * Quem monta (o `SignInPage`) só faz isso a partir de `lg`: abaixo disso o
 * componente não existe e nenhuma imagem da revista é baixada.
 */
export function LoginMagazine() {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const busy = useRef(false);
  const turning = useRef<Turn | null>(null);
  const fallback = useRef<number | undefined>(undefined);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // A capa vai primeiro (no `<img>`, prioridade alta); as vizinhas são preparadas depois, para a próxima virada.
  useEffect(() => {
    for (const neighbor of [index + 1, index - 1]) {
      const page = PAGES[neighbor];
      if (page) void prepare(page.src);
    }
  }, [index]);

  useEffect(() => () => window.clearTimeout(fallback.current), []);

  const finish = useCallback(() => {
    window.clearTimeout(fallback.current);
    const done = turning.current;
    if (!done) return;
    turning.current = null;
    setIndex(done.to);
    setTurn(null);
    busy.current = false;
  }, []);

  async function go(dir: Turn["dir"]) {
    const to = dir === "next" ? index + 1 : index - 1;
    if (busy.current || to < 0 || to >= PAGES.length) return;
    busy.current = true;
    if (reducedMotion) {
      setIndex(to);
      busy.current = false;
      return;
    }
    await prepare(PAGES[to].src);
    turning.current = { from: index, to, dir };
    setTurn(turning.current);
    window.clearTimeout(fallback.current);
    fallback.current = window.setTimeout(finish, TURN_FALLBACK_MS);
  }

  // Avançando, a página nova já está por baixo e a atual vira por cima; voltando, a atual fica por baixo e a anterior volta por cima.
  const basePage = turn ? (turn.dir === "next" ? turn.to : turn.from) : index;
  const leafPage = turn ? (turn.dir === "next" ? turn.from : turn.to) : null;
  const current = PAGES[index];
  const atStart = index === 0;
  const atEnd = index === PAGES.length - 1;

  return (
    <section aria-roledescription="revista" aria-label="Revista Slow Garage, Edição 01" className="magazine">
      <div className="magazine__frame">
        <img
          key={basePage}
          src={PAGES[basePage].src}
          alt={turn ? "" : PAGES[basePage].alt}
          aria-hidden={turn ? true : undefined}
          width={768}
          height={1024}
          decoding="async"
          fetchPriority={basePage === 0 ? "high" : "auto"}
          className="magazine__page"
        />
        {turn && leafPage !== null && (
          <>
            <div aria-hidden="true" className={`magazine__underlay magazine__underlay--${turn.dir}`} />
            <div
              aria-hidden="true"
              className={`magazine__leaf magazine__leaf--${turn.dir}`}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) finish();
              }}
            >
              <img src={PAGES[leafPage].src} alt="" className="magazine__leaf-front" />
              <div className="magazine__leaf-back" />
              <div className="magazine__leaf-shade" />
            </div>
          </>
        )}
      </div>

      {/* Acima da folha: no meio da virada a perspectiva aumenta a folha um pouco além da moldura. */}
      <div className="relative z-10 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          aria-disabled={atStart || undefined}
          onClick={() => void go("prev")}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <p aria-hidden="true" className="type-figure min-w-16 text-center text-sm text-text-secondary">
          {index + 1} de {PAGES.length}
        </p>
        <Button
          variant="outline"
          size="icon"
          aria-label="Próxima página"
          aria-disabled={atEnd || undefined}
          onClick={() => void go("next")}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        Página {index + 1} de {PAGES.length}, {current.title}
      </p>
    </section>
  );
}
