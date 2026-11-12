import coverImage from "@/assets/garage/cover.webp";

/** GIF transparente de 1px: o que o `<img>` carrega quando a capa não aparece (abaixo de `lg`). */
const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Imagem editorial da capa (ADR-094: gerada para o estudo A3.1, fornecida
 * pelo usuário, ilustrativa — não representa veículo cadastrado). Decorativa
 * (`alt=""`) e só a partir de `lg` (64rem): fora disso o navegador escolhe o
 * pixel vazio e não baixa nada. `loading="lazy"` dentro de bloco oculto não
 * bastava — o Chrome baixava a imagem no celular.
 *
 * Usada pela capa da Minha garagem e, desde a etapa 14, pela coluna editorial
 * das telas de entrada (login, cadastro, recuperação).
 */
export function CoverImage({ className }: { className?: string }) {
  return (
    <picture>
      <source media="(min-width: 64rem)" srcSet={coverImage} />
      <img src={BLANK_PIXEL} alt="" decoding="async" className={className} />
    </picture>
  );
}
