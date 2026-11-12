import type { ReactNode } from "react";
import coverCoupe from "@/assets/magazine/capa-cupe.webp";
import meetingParking from "@/assets/magazine/encontro-estacionamento.webp";
import meetingOverpass from "@/assets/magazine/encontro-viaduto.webp";
import meetingGroup from "@/assets/magazine/encontro-grupo.webp";
import meetingCockpit from "@/assets/magazine/encontro-cockpit.webp";
import workshopBench from "@/assets/magazine/oficina-bancada.webp";
import workshopSpring from "@/assets/magazine/oficina-mola.webp";
import workshopDash from "@/assets/magazine/oficina-painel.webp";
import workshopNotebook from "@/assets/magazine/oficina-caderno.webp";

/*
 * Revista Slow Garage — Edição 01, rediagramada para o painel do login
 * (ADR-104, revisão). As cinco artes originais são 3:4; o painel fica entre
 * ~0,7 (1024×768) e ~1,1 (1366×768 com a barra do navegador). Em vez de
 * encaixar a arte inteira (sobrava papel dos lados), cada página é montada
 * aqui: fotos recortadas das próprias artes (só a área da foto, sem papel nem
 * texto) e os títulos e legendas em texto, na fonte serifada japonesa da
 * edição. Tudo se mede pela página (`cqw`/`cqh`), então a composição é a
 * mesma em qualquer tamanho; o que cresce são as fotos.
 *
 * O texto japonês é o da arte, sem tradução (é parte da identidade da
 * edição). Para leitor de tela, a página inteira é decorativa: quem lê é a
 * `description` em português, no componente.
 */

export type MagazinePage = {
  /** Lido como "Página 3 de 5, Encontro noturno — detalhes". */
  title: string;
  /** O que a página mostra, para leitor de tela. */
  description: string;
  /** Fotos da página: baixadas e decodificadas antes da virada que a revela. */
  images: string[];
  content: ReactNode;
};

function Folio({ number, side }: { number: string; side: "left" | "right" }) {
  return (
    <div className="mag-band">
      <p className={`mag-folio mag-folio--${side}`}>{number}</p>
    </div>
  );
}

function RunningHead() {
  return (
    <div className="mag-running-head">
      <p>
        <span className="mag-running-head__name">SLOW GARAGE</span>
        <span className="mag-running-head__issue">Edição 01</span>
      </p>
    </div>
  );
}

type PhotoProps = {
  src: string;
  width: number;
  height: number;
  /** `object-position` — o que não pode sair do quadro quando a foto é recortada. */
  focus?: string;
  className?: string;
  priority?: boolean;
};

function Photo({ src, width, height, focus, className, priority }: PhotoProps) {
  return (
    <div className={`mag-photo ${className ?? ""}`}>
      <img
        src={src}
        alt=""
        width={width}
        height={height}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        style={focus ? { objectPosition: focus } : undefined}
      />
    </div>
  );
}

const cover = (
  <div className="mag-page mag-cover">
    <header className="mag-cover__masthead">
      <p className="mag-cover__nameplate">SLOW GARAGE</p>
      <p className="mag-cover__edition">Edição 01</p>
    </header>
    <p className="mag-cover__tagline">Seus carros. Suas histórias.</p>

    {/* O cupê branco, com os dois cortes diagonais da capa original; a chamada mora no papel acima do corte. */}
    <div className="mag-cover__stage">
      <p lang="ja" className="mag-cover__headline">
        クルマのある
        <br />
        <span className="mag-accent">暮</span>らし
      </p>
      <div className="mag-cover__hero">
      <img
        src={coverCoupe}
        alt=""
        width={1086}
        height={696}
        decoding="async"
        fetchPriority="high"
        className="mag-cover__coupe"
      />
      <p lang="ja" className="mag-cover__feature">
        <span className="mag-tag">特集</span>
        夜のミーティング・ガレージの一日
      </p>
      </div>
    </div>

    <div className="mag-cover__previews">
      <figure className="mag-cover__preview mag-cover__preview--left">
        <Photo src={meetingParking} width={714} height={561} focus="38% 70%" />
        <figcaption lang="ja">夜のミーティング</figcaption>
      </figure>
      <figure className="mag-cover__preview mag-cover__preview--right">
        <Photo src={workshopBench} width={715} height={563} focus="55% 62%" />
        <figcaption lang="ja">ガレージの一日</figcaption>
      </figure>
    </div>

    <div className="mag-band" />
  </div>
);

function Opening({
  title,
  subtitle,
  photo,
  columns,
  folio,
}: {
  title: string;
  subtitle: string;
  photo: ReactNode;
  /** Duas colunas, cada uma com as quebras de linha da arte (no fim de frase, nunca no meio de palavra). */
  columns: [string[], string[]];
  folio: string;
}) {
  return (
    <div className="mag-page mag-opening">
      <RunningHead />
      <div className="mag-opening__title">
        <p lang="ja" className="mag-title">
          {title}
        </p>
        <p className="mag-subtitle">{subtitle}</p>
      </div>
      {photo}
      <div lang="ja" className="mag-columns">
        {columns.map((lines) => (
          <p key={lines[0]}>
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        ))}
      </div>
      <Folio number={folio} side="left" />
    </div>
  );
}

/** Rótulo da página 05: termina onde a linha desenhada na foto começa (`entry`, em % da largura da foto). */
function Callout({ text, entry }: { text: string; entry: number }) {
  return (
    <p lang="ja" className="mag-callout" style={{ right: `${100 - entry}%` }}>
      {text}
    </p>
  );
}

export const PAGES: MagazinePage[] = [
  {
    title: "Capa",
    description:
      "Capa da revista Slow Garage, Edição 01: um cupê branco numa oficina à noite, a chamada “a vida com carros” em japonês e as duas matérias da edição, o encontro noturno e o dia na oficina.",
    images: [coverCoupe, meetingParking, workshopBench],
    content: cover,
  },
  {
    title: "Encontro noturno — abertura",
    description:
      "Abertura da matéria Encontro noturno: um hatch vermelho e um cupê verde num estacionamento à noite, com o texto sobre carros de gerações diferentes lado a lado.",
    images: [meetingParking],
    content: (
      <Opening
        title="夜のミーティング"
        subtitle="Encontro noturno"
        photo={<Photo src={meetingParking} width={714} height={561} focus="50% 62%" className="mag-opening__photo" />}
        columns={[
          ["夜の駐車場に、世代の異なる", "クルマが並ぶ。"],
          ["ボディの形や車内の表情を、", "写真で見比べる。"],
        ]}
        folio="02"
      />
    ),
  },
  {
    title: "Encontro noturno — detalhes",
    description:
      "Encontro noturno: um cupê verde sob um viaduto, o grupo reunido em volta do cupê branco da garagem e o painel de um dos carros.",
    images: [meetingOverpass, meetingGroup, meetingCockpit],
    content: (
      <div className="mag-page mag-gallery">
        <div className="mag-gallery__head">
          <p lang="ja" className="mag-title mag-title--section">
            街に集う
          </p>
        </div>
        <figure className="mag-gallery__lead">
          <Photo src={meetingOverpass} width={695} height={359} focus="50% 78%" />
          <figcaption lang="ja">クーペ</figcaption>
        </figure>
        <div className="mag-gallery__row">
          <figure className="mag-gallery__wide">
            <Photo src={meetingGroup} width={403} height={268} focus="0% 70%" />
            <figcaption lang="ja">街に集う</figcaption>
          </figure>
          <figure className="mag-gallery__narrow">
            <Photo src={meetingCockpit} width={274} height={268} focus="70% 60%" />
            <figcaption lang="ja">コックピット</figcaption>
          </figure>
        </div>
        <Folio number="03" side="right" />
      </div>
    ),
  },
  {
    title: "Um dia na oficina — abertura",
    description:
      "Abertura da matéria Um dia na oficina: mãos organizando chaves numa bancada de ferramentas, com o texto sobre registrar o trabalho do dia.",
    images: [workshopBench],
    content: (
      <Opening
        title="ガレージの一日"
        subtitle="Um dia na oficina"
        photo={<Photo src={workshopBench} width={715} height={563} focus="45% 55%" className="mag-opening__photo" />}
        columns={[
          ["工具を並べ、部品を確認し、", "その日の作業を記録する。"],
          ["手元の写真から、ガレージで", "過ごす時間を切り取る。"],
        ]}
        folio="04"
      />
    ),
  },
  {
    title: "Um dia na oficina — detalhes",
    description:
      "Um dia na oficina: mola e amortecedor sobre a bancada, os instrumentos do painel e um caderno de anotações, cada um com seu nome em japonês.",
    images: [workshopSpring, workshopDash, workshopNotebook],
    content: (
      <div className="mag-page mag-parts">
        <div className="mag-parts__body">
          {/* Fotos sem recorte: as linhas dos rótulos estão desenhadas nelas e precisam bater com o texto. */}
          <figure className="mag-parts__spring">
            <Callout text="スプリング" entry={28.2} />
            <Photo src={workshopSpring} width={702} height={357} />
          </figure>
          <div className="mag-parts__row">
            <figure className="mag-parts__dash">
              <Callout text="計器" entry={29} />
              <Photo src={workshopDash} width={365} height={291} />
            </figure>
            <figure className="mag-parts__notebook">
              <Callout text="作業ノート" entry={43.7} />
              <Photo src={workshopNotebook} width={317} height={299} />
            </figure>
          </div>
        </div>
        <Folio number="05" side="right" />
      </div>
    ),
  },
];
