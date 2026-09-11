/**
 * Recorte e reencode das fotos enviadas pelo app.
 *
 * Foto de celular hoje chega com 4000x3000 e vários MB. Guardar o original
 * significa pagar banda em toda listagem pra exibir a mesma imagem num quadro
 * de 224px, e ainda deixa o enquadramento por conta do acaso — era isso que
 * fazia o card da garagem esticar conforme a proporção da foto. O que sobe é
 * sempre o pedaço escolhido na tela de ajuste, reencodado dentro do limite.
 */

/** Proporção da capa e das fotos da galeria — casa com o quadro do card e da grade. */
export const PHOTO_ASPECT_RATIO = 4 / 3;

/** Maior lado do arquivo final. 1600px cobre tela cheia em telefone retina e mantém o arquivo na casa das centenas de KB. */
export const MAX_IMAGE_DIMENSION_PX = 1600;

const OUTPUT_TYPE = "image/webp";
const OUTPUT_QUALITY = 0.85;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export type CropRect = {
  /** Canto e tamanho do recorte, em pixels da imagem original. */
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
};

/**
 * Decodifica o arquivo e devolve a imagem junto com a URL de blob que a
 * originou. Quem chamou fica dono de revogar a URL: a mesma URL é usada como
 * `src` do `<img>` que a pessoa vê, então revogar aqui dentro (como esta
 * função fazia antes) deixava o quadro do recorte vazio.
 */
export function loadImageFromFile(file: File): Promise<{ image: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir essa imagem."));
    };
    image.src = url;
  });
}

function baseNameOf(fileName: string): string {
  const withoutExtension = fileName.replace(/[.][^.]+$/, "");
  return withoutExtension.trim() || "foto";
}

/**
 * Desenha o recorte num canvas já no tamanho final e devolve um `File` novo.
 * WebP é o alvo; navegador que não codifica WebP cai em PNG sozinho no
 * `toBlob`, e por isso a extensão vem do tipo que o blob realmente tem.
 */
export async function cropImageToFile(
  image: HTMLImageElement,
  rect: CropRect,
  originalName: string,
): Promise<File> {
  const scale = Math.min(1, MAX_IMAGE_DIMENSION_PX / Math.max(rect.sWidth, rect.sHeight));
  const width = Math.max(1, Math.round(rect.sWidth * scale));
  const height = Math.max(1, Math.round(rect.sHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem.");
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    rect.sx,
    rect.sy,
    rect.sWidth,
    rect.sHeight,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, OUTPUT_TYPE, OUTPUT_QUALITY);
  });
  if (!blob) throw new Error("Não foi possível preparar a imagem.");

  const extension = EXTENSION_BY_TYPE[blob.type] ?? "webp";
  return new File([blob], `${baseNameOf(originalName)}.${extension}`, { type: blob.type });
}
