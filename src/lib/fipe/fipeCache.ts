import { supabase } from "@/lib/supabase";

/**
 * `id` é o código de marca da própria FIPE (conferido: `id=21` é "Fiat", o
 * mesmo código 21 da API externa), então serve pra gravar em
 * `vehicles.fipe_brand_id` **e** pra montar a URL da API externa.
 */
export type FipeCachedBrand = { id: number; name: string };

/**
 * Modelo tem **dois** identificadores, e confundi-los quebra em silêncio:
 * `id` é a chave da tabela (é o que `vehicles.fipe_model_id` referencia) e
 * `fipeModelCode` é o código da FIPE (é o que a API externa entende).
 * Conferido: o modelo "147 C/ CL" tem `id=1273` e `fipe_model_code=437`.
 */
export type FipeCachedModel = {
  id: number;
  fipeModelCode: number;
  name: string;
};

/**
 * Marca e modelo vêm do **cache do backend** (`fipe_brands`/`fipe_models`,
 * leitura liberada pra `authenticated`), não da API externa: é dado sob nosso
 * SLA, e é a única fonte cujos IDs podem ser gravados em `vehicles` — as duas
 * colunas são FK pra essas tabelas.
 *
 * Ano e valor continuam na API externa (`fipeExternal`), porque o backend não
 * cacheia tabela de preço — ela muda de mês em mês.
 *
 * Histórico: a fase 020 nasceu lendo marca/modelo da API externa porque, na
 * hora em que foi implementada, a migration ainda não tinha entrado. A
 * interface foi desenhada pra que essa troca fosse aqui dentro, e foi
 * exatamente o que aconteceu (ver ADR-075).
 */
export const fipeCache = {
  async getBrands(): Promise<FipeCachedBrand[]> {
    const { data, error } = await supabase
      .from("fipe_brands")
      .select("id, name")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },

  async getModelsByBrand(brandId: number): Promise<FipeCachedModel[]> {
    const { data, error } = await supabase
      .from("fipe_models")
      .select("id, fipe_model_code, name")
      .eq("brand_id", brandId)
      .order("name")
      // A marca com mais modelos tem 585 (medido); o teto do PostgREST é 1000.
      // Explícito pra que crescer além disso vire erro visível, não silêncio.
      .limit(1000);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      fipeModelCode: row.fipe_model_code,
      name: row.name,
    }));
  },
};
