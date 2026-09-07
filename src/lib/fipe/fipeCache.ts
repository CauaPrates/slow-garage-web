import { fetchBrands, fetchModels } from "./fipeExternal";
import type { FipeBrand, FipeModel } from "./fipeExternal";

/**
 * Fonte de marca e modelo da FIPE — a camada que **deveria** ler as tabelas
 * `fipe_brands`/`fipe_models` do Supabase (cache do backend, RLS de leitura
 * pra `authenticated`).
 *
 * ⚠️ Hoje ela lê da API externa, não do Supabase. Motivo registrado no
 * ADR-075: no dia em que a fase 020 foi implementada, o schema real do
 * projeto **não tinha** essas tabelas — `npm run types` contra o projeto
 * remoto trouxe zero ocorrência de `fipe`, e `vehicles` não tinha
 * `fipe_brand_id`/`fipe_model_id`. Em vez de codar contra um contrato que
 * não existe, a implementação foi ligada na API externa mantendo **esta
 * interface exata**.
 *
 * Quando a migration entrar, a troca é só aqui dentro — nenhum hook,
 * componente ou teste precisa mudar:
 *
 * ```ts
 * const { data, error } = await supabase
 *   .from("fipe_brands")
 *   .select("id, name")
 *   .order("name");
 * ```
 *
 * A distinção importa porque as duas fontes têm custo diferente: o Supabase
 * é cache próprio (rápido, sob nosso SLA) e a API externa é terceiro sem
 * garantia. Enquanto for a segunda, marca e modelo herdam a mesma
 * fragilidade de rede que ano e valor — e a UI trata os dois iguais.
 */
export const fipeCache = {
  getBrands(): Promise<FipeBrand[]> {
    return fetchBrands();
  },

  getModelsByBrand(brandId: string): Promise<FipeModel[]> {
    return fetchModels(brandId);
  },
};
