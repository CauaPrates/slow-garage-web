/**
 * Lateral da coleção da Minha garagem (13/11/2026): a partir desta largura de
 * tela a coleção (sem a lateral do app e as margens) passa de ~94rem e, com
 * poucos veículos, a grade para no teto dela (ADR-095) — sobra uma faixa à
 * direita. Ali entra "Detalhes e comparativo", aberto (com um veículo só, que
 * não tem comparativo, as pendências da garagem). A mesma largura está em
 * `garage.css` (`.garage-aside`).
 */
export const GARAGE_ASIDE_QUERY = "(min-width: 115rem)";
