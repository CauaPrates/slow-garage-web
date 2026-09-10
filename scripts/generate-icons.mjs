// Gera os ícones do PWA a partir da logo da marca (logo-slow-garage.png,
// badge SG colorido sobre fundo transparente) composta sobre o fundo dark.
// Reexecute com `npm run icons` sempre que a logo de origem mudar.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("logo-slow-garage.png");
const OUT_DIR = path.resolve("public/icons");
const BG = { r: 0x12, g: 0x13, b: 0x16, alpha: 1 };

const ICONS = [
  { name: "icon-192.png", size: 192, logoScale: 0.82 },
  { name: "icon-512.png", size: 512, logoScale: 0.82 },
  // maskable precisa de folga extra: sistemas cortam um círculo ~80% do
  // lado, então o conteúdo tem que caber bem dentro disso.
  { name: "icon-maskable-512.png", size: 512, logoScale: 0.58 },
  { name: "apple-touch-icon.png", size: 180, logoScale: 0.78 },
  { name: "favicon-32.png", size: 32, logoScale: 0.88 },
];

async function makeIcon({ name, size, logoScale }) {
  const targetWidth = Math.round(size * logoScale);

  // `trim` remove a margem transparente do arquivo de origem — sem isso a
  // escala abaixo mediria o canvas, não o desenho, e a logo sairia menor do
  // que o pedido. O box é quadrado com `fit: inside` porque a logo é larga
  // (~1.9:1): limitar só a largura deixaria a altura livre e, numa logo mais
  // alta no futuro, estouraria o enquadramento do ícone.
  const logoBuffer = await sharp(SRC)
    .trim({ threshold: 1 })
    .resize({
      width: targetWidth,
      height: targetWidth,
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();
  const { width: logoWidth, height: logoHeight } =
    await sharp(logoBuffer).metadata();

  const left = Math.round((size - (logoWidth ?? targetWidth)) / 2);
  const top = Math.round((size - (logoHeight ?? targetWidth)) / 2);

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logoBuffer, left, top }])
    .png()
    .toFile(path.join(OUT_DIR, name));

  console.log(`gerado ${name} (${size}x${size}, logo ${logoWidth}px de largura)`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const icon of ICONS) {
  await makeIcon(icon);
}
