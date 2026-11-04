import coverImage from "@/assets/garage/cover.webp";
import { CreateVehicleDialog } from "./CreateVehicleDialog";

/** GIF transparente de 1px: o que o `<img>` carrega quando a capa não aparece (abaixo de `lg`). */
const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Imagem da capa só a partir de `lg` (64rem, o mesmo corte do CSS): fora
 * disso o navegador escolhe o pixel vazio e não baixa nada. `loading="lazy"`
 * dentro de bloco oculto não bastava — o Chrome baixava a imagem no celular.
 */
function CoverImage({ src }: { src: string }) {
  return (
    <picture>
      <source media="(min-width: 64rem)" srcSet={src} />
      <img src={BLANK_PIXEL} alt="" decoding="async" />
    </picture>
  );
}

type GarageCoverProps = {
  /** Sem veículo, a chamada de cadastro fica só no painel do estado vazio — uma por contexto. */
  showCreate: boolean;
};

/**
 * Capa da Minha garagem — Garagem A3 com a capa da A3.1 (ADR-094).
 *
 * Celular e tablet (< lg): cabeçalho compacto, sem foto — sobrelinha com o
 * slogan, "Minha garagem" grande e "Cadastrar" ao lado; o primeiro carro
 * aparece logo depois do resumo.
 *
 * Desktop (lg+): página dupla. À esquerda, no grafite: "Minha garagem" como
 * sobrelinha (é o `h1`), o slogan como título, "Cadastrar veículo" e uma
 * linha de apoio. À direita, a capa da A3.1: uma imagem só, já composta —
 * cupê numa oficina com luz quente e recortes de roda e motor —, 3:1, com a
 * esquerda quase preta. A partir de 1280 aparece inteira, na altura da capa
 * (264 → 380 px); entre 1024 e 1279, só o trecho do carro e dos recortes.
 * No tema claro vira chapa de borda seca (sem degradê). Regras em
 * `garage.css`.
 *
 * A imagem é editorial e ilustrativa — gerada para o estudo e fornecida pelo
 * usuário; não representa veículo cadastrado (fonte em docs/DESIGN.md). É
 * decorativa (`alt=""`, bloco `aria-hidden`) e servida por `<picture>` com
 * `media` de lg: o celular não a baixa.
 */
export function GarageCover({ showCreate }: GarageCoverProps) {
  return (
    <div className="garage-cover">
      <div className="garage-cover__art" aria-hidden="true">
        <div className="garage-cover__photo">
          <CoverImage src={coverImage} />
        </div>
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
