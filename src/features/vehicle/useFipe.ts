import { useQuery } from "@tanstack/react-query";
import { fipeCache } from "@/lib/fipe/fipeCache";
import { fetchValue, fetchYears } from "@/lib/fipe/fipeExternal";

/**
 * Chave fora do prefixo `["vehicles", ...]` de propósito: o catálogo da FIPE
 * não é dado do usuário e não pode ser invalidado por mutação de veículo —
 * senão salvar um gasto jogaria fora as 107 marcas à toa.
 */
const FIPE_KEY = "fipe";

/** Catálogo do backend muda raramente; 24h evita refazer a leitura a cada abertura do formulário. */
const CATALOG_OPTIONS = {
  staleTime: 24 * 60 * 60 * 1000,
  gcTime: 24 * 60 * 60 * 1000,
} as const;

export function useFipeBrands(enabled = true) {
  return useQuery({
    queryKey: [FIPE_KEY, "brands"],
    queryFn: () => fipeCache.getBrands(),
    enabled,
    ...CATALOG_OPTIONS,
  });
}

export function useFipeModels(brandId: number | null) {
  return useQuery({
    queryKey: [FIPE_KEY, "models", brandId],
    queryFn: () => fipeCache.getModelsByBrand(brandId!),
    enabled: brandId != null,
    ...CATALOG_OPTIONS,
  });
}

/** Resolve o `fipe_model_id` gravado no veículo no código que a API externa entende. */
export function useFipeModel(modelId: number | null) {
  return useQuery({
    queryKey: [FIPE_KEY, "model", modelId],
    queryFn: () => fipeCache.getModelById(modelId!),
    enabled: modelId != null,
    ...CATALOG_OPTIONS,
  });
}

/**
 * Ano e valor vêm da API externa (terceiro sem SLA): `retry: 1` porque
 * insistir 3 vezes só faz o usuário esperar mais pra ver o mesmo erro.
 *
 * Recebe `fipeModelCode`, **não** o `id` da tabela — a API externa só entende
 * o código da FIPE. E exige a marca no caminho
 * (`/marcas/{marca}/modelos/{modelo}/anos`), por isso `brandId` também entra.
 *
 * O `enabled` externo é o que garante o "sob demanda" da spec: sem ele,
 * escolher um modelo já dispararia a consulta de ano.
 */
export function useFipeYears(
  brandId: number | null,
  fipeModelCode: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [FIPE_KEY, "years", brandId, fipeModelCode],
    queryFn: () => fetchYears(String(brandId), String(fipeModelCode)),
    enabled: enabled && brandId != null && fipeModelCode != null,
    retry: 1,
  });
}

/**
 * A tabela FIPE muda de mês em mês, então reperguntar de hora em hora é
 * desperdício — e o painel do veículo consulta a cada visita. Seis horas
 * segura a repetição sem nunca mostrar mês de referência velho. Quem quiser
 * conferir na hora usa o botão de atualizar, que chama `refetch()` e passa
 * por cima disto.
 */
const VALUE_STALE_TIME = 6 * 60 * 60 * 1000;

export function useFipeEstimatedValue(
  brandId: number | null,
  fipeModelCode: number | null,
  yearCode: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [FIPE_KEY, "value", brandId, fipeModelCode, yearCode],
    queryFn: () =>
      fetchValue(String(brandId), String(fipeModelCode), yearCode!),
    enabled:
      enabled && brandId != null && fipeModelCode != null && Boolean(yearCode),
    retry: 1,
    staleTime: VALUE_STALE_TIME,
  });
}
