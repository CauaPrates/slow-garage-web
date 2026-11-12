/*
 * Geometria da virada pelo canto (revista do login, ADR-104).
 *
 * Mesma ideia do StPageFlip em modo de página única, que foi testado no
 * painel e não adotado (o laço de `requestAnimationFrame` dele nunca para,
 * nem depois de `destroy()`, e o verso da folha é a própria arte espelhada).
 *
 * Uma página W×H com a lombada na borda esquerda. O canto inferior direito
 * `C` é levado até `P`, que percorre um arco de `C` até `(-W, H)` (a página
 * deitada do outro lado da lombada), subindo um pouco no meio do caminho — é
 * isso que faz a ponta "levantar". A dobra é a mediatriz de C–P:
 *
 * - do lado da lombada fica o que ainda não saiu do lugar (`front`);
 * - do lado do canto fica a parte erguida (`lifted`), que revela a página de
 *   baixo; ela aparece refletida pela dobra (`flap`): é o verso, em marfim.
 *
 * Voltar é a mesma virada tocada de trás pra frente (progresso de 1 a 0) com
 * a página anterior por cima: a folha volta da lombada e assenta da esquerda
 * pra direita.
 */

type Point = { x: number; y: number };

export type CurlFrame = {
  /** Parte da página de cima que continua no lugar — `clip-path` dela. */
  front: string;
  /** Parte erguida, nas coordenadas da página — `clip-path` do verso e da sombra na página de baixo. */
  lifted: string;
  /** Reflexão pela dobra — `transform` do verso. */
  flap: string;
  /** Sombreado da curvatura, no verso (fundo em gradiente, coordenadas da página). */
  flapShade: string;
  /** Sombra que a folha erguida joga na página de baixo. */
  cast: string;
};

const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;

/** Recorta o polígono convexo pelo semiplano `sign · (X − m)·n ≤ 0` (Sutherland–Hodgman, uma aresta). */
function clip(poly: Point[], m: Point, n: Point, sign: 1 | -1): Point[] {
  const side = (p: Point) => sign * ((p.x - m.x) * n.x + (p.y - m.y) * n.y);
  const out: Point[] = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa <= 0) out.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  });
  return out;
}

function polygon(points: Point[]): string {
  // Menos de 3 pontos: área vazia (o início e o fim da virada).
  if (points.length < 3) return "polygon(0 0, 0 0, 0 0)";
  return `polygon(${points.map((p) => `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`).join(", ")})`;
}

/**
 * Gradiente linear perpendicular à dobra, começando exatamente nela.
 * `stops` em px a partir da dobra, para dentro da parte erguida.
 */
function foldGradient(width: number, height: number, m: Point, n: Point, stops: [string, number][]): string {
  const angle = Math.atan2(n.x, -n.y);
  const length = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
  const center = { x: width / 2, y: height / 2 };
  const fold = dot({ x: m.x - center.x, y: m.y - center.y }, n) + length / 2;
  const list = stops.map(([color, offset]) => `${color} ${(fold + offset).toFixed(1)}px`).join(", ");
  return `linear-gradient(${angle.toFixed(4)}rad, ${list})`;
}

/** `progress` de 0 (página no lugar) a 1 (página toda virada para o outro lado). */
export function curlFrame(width: number, height: number, progress: number): CurlFrame {
  const theta = Math.PI * Math.min(1, Math.max(0, progress));
  const lift = Math.min(width, height) * 0.3;
  const corner = { x: width, y: height };
  const tip = { x: width * Math.cos(theta), y: height - lift * Math.sin(theta) };
  const dx = corner.x - tip.x;
  const dy = corner.y - tip.y;
  const distance = Math.hypot(dx, dy);
  const page = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  if (distance < 0.5) {
    return { front: polygon(page), lifted: polygon([]), flap: "none", flapShade: "none", cast: "none" };
  }

  const n = { x: dx / distance, y: dy / distance };
  const m = { x: (corner.x + tip.x) / 2, y: (corner.y + tip.y) / 2 };
  const k = 2 * dot(m, n);
  // Reflexão pela reta da dobra: X' = (I − 2nnᵀ)X + 2(m·n)n.
  const flap = `matrix(${1 - 2 * n.x * n.x}, ${-2 * n.x * n.y}, ${-2 * n.x * n.y}, ${1 - 2 * n.y * n.y}, ${k * n.x}, ${k * n.y})`;

  // Mais forte no meio da virada; some quando a folha está quase deitada.
  const strength = Math.sin(theta);
  const bend = Math.min(width, distance) * 0.5;
  const flapShade = foldGradient(width, height, m, n, [
    [`rgb(0 0 0 / ${(0.2 * strength).toFixed(3)})`, 0],
    [`rgb(255 255 255 / ${(0.5 * strength).toFixed(3)})`, bend * 0.18],
    [`rgb(0 0 0 / ${(0.05 * strength).toFixed(3)})`, bend * 0.55],
    ["rgb(0 0 0 / 0)", bend],
  ]);
  const cast = foldGradient(width, height, m, n, [
    [`rgb(0 0 0 / ${(0.42 * strength).toFixed(3)})`, 0],
    [`rgb(0 0 0 / ${(0.12 * strength).toFixed(3)})`, bend * 0.22],
    ["rgb(0 0 0 / 0)", bend * 0.6],
  ]);

  return {
    front: polygon(clip(page, m, n, 1)),
    lifted: polygon(clip(page, m, n, -1)),
    flap,
    flapShade,
    cast,
  };
}

/** Acelera ao sair do canto e desacelera ao deitar a folha. */
export function easeTurn(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
