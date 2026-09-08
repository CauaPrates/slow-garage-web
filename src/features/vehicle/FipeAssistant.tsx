import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { FipeError } from "@/lib/fipe/fipeExternal";
import {
  useFipeBrands,
  useFipeEstimatedValue,
  useFipeModels,
  useFipeYears,
} from "./useFipe";

export type FipeFillPayload = {
  make: string;
  model: string;
  /** Só vem quando o usuário chegou a escolher um ano. */
  modelYear?: number;
  /**
   * IDs graváveis em `vehicles.fipe_brand_id`/`fipe_model_id`. Vêm das tabelas
   * do backend (as duas colunas são FK), **não** do código da API externa —
   * confundir os dois grava FK inválida. Só chegam quando o usuário completou
   * marca e modelo.
   */
  fipeBrandId: number;
  fipeModelId: number;
};

type FipeAssistantProps = {
  onFill: (payload: FipeFillPayload) => void;
  onFillValue: (amount: number) => void;
};

function ErrorLine({ error }: { error: unknown }) {
  const message =
    error instanceof FipeError
      ? error.message
      : "Não foi possível consultar a FIPE. Preencha à mão.";
  return (
    <p role="alert" className="text-sm text-error">
      {message}
    </p>
  );
}

/**
 * Assistente **opcional** de preenchimento pela tabela FIPE (fase 020).
 *
 * Duas regras que moldam tudo aqui:
 *
 * 1. Não bloqueia nada. Nasce fechado, e o formulário manual funciona igual
 *    com a FIPE fora do ar — por isso cada consulta tem estado de erro
 *    próprio e local, sem `throw` que suba pro formulário.
 * 2. O que a FIPE devolve **não é dado calculado pelo sistema**: cai nos
 *    mesmos campos de texto que o usuário digitaria, e ele edita ou apaga
 *    depois. Nada aqui grava direto.
 *
 * Ano e valor só são consultados sob demanda (`showYear`), não ao escolher o
 * modelo — são as duas chamadas que a spec pediu pra não disparar sozinhas.
 */
export function FipeAssistant({ onFill, onFillValue }: FipeAssistantProps) {
  const [open, setOpen] = useState(false);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [modelId, setModelId] = useState<number | null>(null);
  const [modelFipeCode, setModelFipeCode] = useState<number | null>(null);
  const [modelName, setModelName] = useState("");
  const [showYear, setShowYear] = useState(false);
  const [yearCode, setYearCode] = useState<string | null>(null);
  const [valueUsed, setValueUsed] = useState(false);

  const bodyId = useId();
  const brandFieldId = useId();
  const modelFieldId = useId();
  const yearFieldId = useId();

  const brandsQuery = useFipeBrands(open);
  const modelsQuery = useFipeModels(brandId);
  const yearsQuery = useFipeYears(brandId, modelFipeCode, showYear);
  const valueQuery = useFipeEstimatedValue(
    brandId,
    modelFipeCode,
    yearCode,
    showYear,
  );

  const canFill = brandId != null && modelId != null;
  const selectedYear = yearsQuery.data?.find((y) => y.code === yearCode);
  /** O código do ano vem como "2019-1" (ano + combustível); só o ano interessa pro formulário. */
  const yearNumber = selectedYear
    ? Number.parseInt(selectedYear.code.split("-")[0] ?? "", 10)
    : Number.NaN;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-3">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm font-medium text-text-primary"
        >
          Buscar dados na FIPE
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-safe:duration-150",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>

      <div
        id={bodyId}
        className={cn("flex-col gap-4", open ? "flex" : "hidden")}
      >
        <p className="text-xs text-text-secondary">
          Opcional. Preenche marca e modelo pra você — dá pra editar tudo
          depois, e o preenchimento manual continua funcionando normalmente.
        </p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={brandFieldId}>Marca na FIPE</Label>
          <Combobox
            id={brandFieldId}
            options={(brandsQuery.data ?? []).map((brand) => ({
              value: String(brand.id),
              label: brand.name,
            }))}
            value={brandId != null ? String(brandId) : null}
            loading={brandsQuery.isLoading}
            onChange={(value, option) => {
              setBrandId(Number(value));
              setBrandName(option.label);
              setModelId(null);
              setModelFipeCode(null);
              setModelName("");
              setYearCode(null);
              setValueUsed(false);
            }}
            placeholder="Escolha a marca"
            searchPlaceholder="Buscar marca…"
            emptyMessage="Nenhuma marca com esse nome."
          />
          {brandsQuery.isError && <ErrorLine error={brandsQuery.error} />}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={modelFieldId}>Modelo na FIPE</Label>
          <Combobox
            id={modelFieldId}
            options={(modelsQuery.data ?? []).map((model) => ({
              value: String(model.id),
              label: model.name,
            }))}
            value={modelId != null ? String(modelId) : null}
            disabled={brandId == null}
            loading={modelsQuery.isLoading}
            onChange={(value, option) => {
              const id = Number(value);
              setModelId(id);
              setModelName(option.label);
              // O código da FIPE é outro campo da mesma linha — a API externa
              // não entende o `id` da tabela.
              setModelFipeCode(
                modelsQuery.data?.find((m) => m.id === id)?.fipeModelCode ??
                  null,
              );
              setYearCode(null);
              setValueUsed(false);
            }}
            placeholder={
              brandId != null ? "Escolha o modelo" : "Escolha a marca primeiro"
            }
            searchPlaceholder="Buscar modelo…"
            emptyMessage="Nenhum modelo com esse nome."
          />
          {modelsQuery.isError && <ErrorLine error={modelsQuery.error} />}
        </div>

        {canFill && (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            {!showYear ? (
              <button
                type="button"
                onClick={() => setShowYear(true)}
                className="flex min-h-11 items-center self-start text-xs font-medium text-accent hover:underline"
              >
                Buscar também o ano e o valor de referência
              </button>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={yearFieldId}>Ano na FIPE (opcional)</Label>
                <Combobox
                  id={yearFieldId}
                  options={(yearsQuery.data ?? []).map((year) => ({
                    value: year.code,
                    label: year.name,
                  }))}
                  value={yearCode}
                  loading={yearsQuery.isLoading}
                  onChange={(code) => {
                    setYearCode(code);
                    setValueUsed(false);
                  }}
                  placeholder="Escolha o ano"
                  searchPlaceholder="Buscar ano…"
                  emptyMessage="Nenhum ano disponível."
                />
                {yearsQuery.isError && <ErrorLine error={yearsQuery.error} />}

                {valueQuery.isLoading && yearCode && (
                  <p className="text-sm text-text-secondary">
                    Consultando o valor na FIPE…
                  </p>
                )}
                {valueQuery.isError && <ErrorLine error={valueQuery.error} />}

                {valueQuery.data && (
                  <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
                    <p className="text-sm text-text-primary">
                      Valor de referência:{" "}
                      <span className="font-mono">
                        {formatMoney(valueQuery.data.amount)}
                      </span>
                    </p>
                    <p className="text-xs text-text-secondary">
                      Tabela FIPE de {valueQuery.data.referenceMonth} · código{" "}
                      {valueQuery.data.fipeCode}. É uma sugestão — o campo
                      continua editável.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="self-start"
                      onClick={() => {
                        onFillValue(valueQuery.data.amount);
                        setValueUsed(true);
                      }}
                    >
                      {valueUsed
                        ? "Valor preenchido"
                        : "Usar como valor estimado"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <Button
            type="button"
            disabled={!canFill}
            onClick={() =>
              onFill({
                make: brandName,
                model: modelName,
                modelYear: Number.isFinite(yearNumber) ? yearNumber : undefined,
                fipeBrandId: brandId!,
                fipeModelId: modelId!,
              })
            }
          >
            Preencher com dados FIPE
          </Button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center text-xs font-medium text-text-secondary hover:underline"
          >
            Não encontrei meu carro
          </button>
        </div>
      </div>
    </div>
  );
}
