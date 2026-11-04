import coverBase from "@/assets/garage/cover-base.webp";
import collageCage from "@/assets/garage/collage-cage.webp";
import collageEngine from "@/assets/garage/collage-engine.webp";
import collageGarage from "@/assets/garage/collage-garage.webp";
import { CreateVehicleDialog } from "./CreateVehicleDialog";

/** GIF transparente de 1px: o que o `<img>` carrega quando a colagem não aparece (abaixo de `lg`). */
const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Foto da colagem só a partir de `lg` (64rem, o mesmo corte do CSS): fora
 * disso o navegador escolhe o pixel vazio e não baixa nada. O motor entra a
 * partir de 80rem e a gaiola a partir de 112.5rem — os mesmos cortes em que
 * aparecem na colagem (`garage.css`). `loading="lazy"`
 * dentro de bloco oculto não bastava — o Chrome baixava as quatro no celular.
 */
function CoverImage({ src, media = "(min-width: 64rem)" }: { src: string; media?: string }) {
  return (
    <picture>
      <source media={media} srcSet={src} />
      <img src={BLANK_PIXEL} alt="" decoding="async" />
    </picture>
  );
}

type GarageCoverProps = {
  /** Sem veículo, a chamada de cadastro fica só no painel do estado vazio — uma por contexto. */
  showCreate: boolean;
};

/**
 * Capa da Minha garagem — Garagem A3 com a capa em colagem da A3.1 (ADR-094).
 *
 * Celular e tablet (< lg): cabeçalho compacto, sem foto — sobrelinha com o
 * slogan, "Minha garagem" grande e "Cadastrar" ao lado; o primeiro carro
 * aparece logo depois do resumo.
 *
 * Desktop (lg+): página dupla. À esquerda, no grafite: "Minha garagem" como
 * sobrelinha (é o `h1`), o slogan como título, "Cadastrar veículo" e uma
 * linha de apoio. À direita, a colagem: a foto de oficina escurecida como
 * fundo e recortes com moldura fina e inclinação discreta — um até 1280 px,
 * dois até 1800, três acima. Altura travada entre 264 e 380 px; nada sobre
 * o texto (posições em `garage.css`).
 *
 * As fotos são editoriais e ilustrativas (Unsplash, CC0 — atribuição
 * dispensada; fontes em docs/DESIGN.md), decorativas (`alt=""`, bloco
 * `aria-hidden`) e não representam veículo do usuário. Servidas por
 * `<picture>` com `media` de lg: o celular não as baixa.
 */
export function GarageCover({ showCreate }: GarageCoverProps) {
  return (
    <div className="garage-cover">
      <div className="garage-cover__art" aria-hidden="true">
        <div className="garage-cover__base">
          <CoverImage src={coverBase} />
        </div>
        <figure className="garage-cover__clip garage-cover__clip--cage">
          <CoverImage src={collageCage} media="(min-width: 112.5rem)" />
        </figure>
        <figure className="garage-cover__clip garage-cover__clip--garage">
          <CoverImage src={collageGarage} />
        </figure>
        <figure className="garage-cover__clip garage-cover__clip--engine">
          <CoverImage src={collageEngine} media="(min-width: 80rem)" />
        </figure>
      </div>

      <header className="garage-cover__text garage-gutter">
        <div className="garage-cover__titles">
          <h1 className="garage-cover__title">Minha garagem</h1>
          <p className="garage-cover__slogan">
            Seus carros. <br />
            Suas histórias.
          </p>
          <div className="garage-cover__actions">
            {showCreate && (
              <CreateVehicleDialog
                withIcon
                triggerLabel={
                  <>
                    {/* No celular o rótulo encurta; o nome acessível é sempre "Cadastrar veículo". */}
                    <span>
                      Cadastrar<span className="sr-only lg:not-sr-only"> veículo</span>
                    </span>
                  </>
                }
                triggerClassName="px-3.5 lg:h-11.5 lg:px-5 lg:text-base"
              />
            )}
            <p className="garage-cover__lede">Gastos, manutenção e projetos de cada carro, num lugar só.</p>
          </div>
        </div>
      </header>
    </div>
  );
}
