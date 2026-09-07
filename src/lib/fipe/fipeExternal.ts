/**
 * Cliente fino da API FIPE pública (Parallelum). Serviço de terceiro **sem
 * SLA**: toda chamada tem timeout e todo erro vira `FipeError` com uma
 * mensagem já em português, pronta pra tela — nunca um `unknown` que o
 * componente precise adivinhar.
 *
 * Nada daqui é persistido no Supabase (RN-3 da spec 020): é leitura ao vivo,
 * usada só para preencher campo de texto que o usuário pode editar depois.
 */

const BASE_URL = "https://parallelum.com.br/fipe/api/v1/carros";

/** A API responde em ~1s no caminho feliz; 10s é folga pra rede ruim sem prender a UI. */
const TIMEOUT_MS = 10_000;

export type FipeBrand = { code: string; name: string };
export type FipeModel = { code: string; name: string };
export type FipeYear = { code: string; name: string };

export type FipeValue = {
  /** Valor já convertido pra número — a API devolve string formatada ("R$ 6.136,00"). */
  amount: number;
  /** Texto original, pra exibir exatamente como a FIPE publicou. */
  formatted: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  fipeCode: string;
  /** Mês de referência da tabela (ex.: "setembro de 2026") — o valor não é "de hoje". */
  referenceMonth: string;
};

export class FipeError extends Error {
  readonly kind: "timeout" | "network" | "http" | "shape";

  constructor(kind: FipeError["kind"], message: string) {
    super(message);
    this.name = "FipeError";
    this.kind = kind;
  }
}

async function fipeGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FipeError(
        "timeout",
        "A consulta à FIPE demorou demais. Tente de novo ou preencha à mão.",
      );
    }
    throw new FipeError(
      "network",
      "Não foi possível falar com a FIPE. Verifique a conexão ou preencha à mão.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new FipeError(
      "http",
      `A FIPE respondeu com erro (${response.status}). Tente de novo ou preencha à mão.`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new FipeError(
      "shape",
      "A FIPE devolveu uma resposta inesperada. Preencha à mão.",
    );
  }
}

/**
 * `codigo` vem `string` em marca/ano e `number` em modelo — inconsistência da
 * própria API, normalizada aqui pra que o resto do app trate tudo como string.
 */
function toCode(value: string | number): string {
  return String(value);
}

export async function fetchBrands(): Promise<FipeBrand[]> {
  const data =
    await fipeGet<Array<{ codigo: string | number; nome: string }>>("/marcas");
  return data.map((item) => ({ code: toCode(item.codigo), name: item.nome }));
}

export async function fetchModels(brandCode: string): Promise<FipeModel[]> {
  const data = await fipeGet<{
    modelos: Array<{ codigo: string | number; nome: string }>;
  }>(`/marcas/${encodeURIComponent(brandCode)}/modelos`);
  return (data.modelos ?? []).map((item) => ({
    code: toCode(item.codigo),
    name: item.nome,
  }));
}

export async function fetchYears(
  brandCode: string,
  modelCode: string,
): Promise<FipeYear[]> {
  const data = await fipeGet<Array<{ codigo: string | number; nome: string }>>(
    `/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos`,
  );
  return data.map((item) => ({ code: toCode(item.codigo), name: item.nome }));
}

/**
 * `"R$ 6.136,00"` -> `6136`. Devolve `null` em vez de `NaN` quando a string
 * não tem número nenhum — quem consome decide o que mostrar, sem propagar
 * `NaN` pra dentro de um campo de formulário.
 */
export function parseFipeAmount(formatted: string): number | null {
  const digits = formatted
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchValue(
  brandCode: string,
  modelCode: string,
  yearCode: string,
): Promise<FipeValue> {
  const data = await fipeGet<{
    Valor: string;
    Marca: string;
    Modelo: string;
    AnoModelo: number;
    Combustivel: string;
    CodigoFipe: string;
    MesReferencia: string;
  }>(
    `/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos/${encodeURIComponent(yearCode)}`,
  );

  const amount = parseFipeAmount(data.Valor ?? "");
  if (amount == null) {
    throw new FipeError(
      "shape",
      "A FIPE devolveu um valor que não deu pra interpretar. Preencha à mão.",
    );
  }

  return {
    amount,
    formatted: data.Valor,
    brand: data.Marca,
    model: data.Modelo,
    modelYear: data.AnoModelo,
    fuel: data.Combustivel,
    fipeCode: data.CodigoFipe,
    referenceMonth: data.MesReferencia,
  };
}
