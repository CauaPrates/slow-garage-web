import { useQuery } from "@tanstack/react-query";
import { fipeCache } from "@/lib/fipe/fipeCache";
import { fetchValue, fetchYears } from "@/lib/fipe/fipeExternal";

/**
 * Chave separada de `["vehicles", ...]` de propósito: dado da FIPE não é dado
 * do usuário e não pode ser invalidado por mutação de veículo — se entrasse no
 * mesmo prefixo, salvar um gasto jogaria fora a lista de 107 marcas à toa.
 */
const FIPE_KEY = "fipe";

/**
 * Catálogo raramente muda; 24h de `staleTime` evita refazer a leitura a cada
 * abertura do formulário. `retry: 1` porque a origem é terceiro sem SLA:
 * insistir 3 vezes (padrão do React Query) só faz o usuário esperar mais pra
 * ver o mesmo erro.
 */
const CATALOG_OPTIONS = {
  staleTime: 24 * 60 * 60 * 1000,
  gcTime: 24 * 60 * 60 * 1000,
  retry: 1,
} as const;

export function useFipeBrands(enabled = true) {
  return useQuery({
    queryKey: [FIPE_KEY, "brands"],
    queryFn: () => fipeCache.getBrands(),
    enabled,
    ...CATALOG_OPTIONS,
  });
}

export function useFipeModels(brandCode: string | null) {
  return useQuery({
    queryKey: [FIPE_KEY, "models", brandCode],
    queryFn: () => fipeCache.getModelsByBrand(brandCode!),
    enabled: Boolean(brandCode),
    ...CATALOG_OPTIONS,
  });
}

/**
 * `enabled` externo além do `brandCode`/`modelCode`: a spec pede que ano só
 * seja buscado **sob demanda** (quando o usuário abre a seção de ano), não
 * automaticamente ao escolher o modelo. Sem esse terceiro controle, escolher
 * um modelo já dispararia a chamada.
 *
 * A API exige a marca no caminho (`/marcas/{marca}/modelos/{modelo}/anos`),
 * então a assinatura leva `brandCode` — não dá pra buscar ano só com o código
 * do modelo, como a spec original supunha.
 */
export function useFipeYears(
  brandCode: string | null,
  modelCode: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [FIPE_KEY, "years", brandCode, modelCode],
    queryFn: () => fetchYears(brandCode!, modelCode!),
    enabled: enabled && Boolean(brandCode) && Boolean(modelCode),
    retry: 1,
  });
}

/** Valor é consulta ao vivo (a tabela FIPE muda de mês em mês) — sem `staleTime` longo. */
export function useFipeEstimatedValue(
  brandCode: string | null,
  modelCode: string | null,
  yearCode: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [FIPE_KEY, "value", brandCode, modelCode, yearCode],
    queryFn: () => fetchValue(brandCode!, modelCode!, yearCode!),
    enabled:
      enabled && Boolean(brandCode) && Boolean(modelCode) && Boolean(yearCode),
    retry: 1,
  });
}
