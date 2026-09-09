import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format";
import { FipeError } from "@/lib/fipe/fipeExternal";
import { useFipeEstimatedValue, useFipeYears } from "./useFipe";

type FipeValueLookupProps = {
  brandId: number;
  /** Código da FIPE do modelo — a API externa não entende o id da tabela (RN-9). */
  fipeModelCode: number;
  onUseValue: (amount: number) => void;
};

function ErrorLine({ error }: { error: unknown }) {
  return (
    <p role="alert" className="text-sm text-error">
      {error instanceof FipeError
        ? error.message
        : "Não foi possível consultar a FIPE. Preencha à mão."}
    </p>
  );
}

/**
 * Fase 026: o que sobrou do antigo bloco "Buscar dados na FIPE" depois que a
 * escolha de marca e modelo passou pros próprios campos do formulário.
 *
 * Só aparece quando o veículo **já foi identificado** na FIPE (marca e modelo
 * escolhidos da lista, não digitados) — sem isso não há o que consultar. E
 * continua sob demanda: o ano só é buscado depois de um clique, porque são
 * duas chamadas a um terceiro sem SLA.
 *
 * O valor devolvido é sugestão, nunca dado calculado (RN-1): vai pro mesmo
 * campo de texto que o usuário pode editar ou apagar.
 */
export function FipeValueLookup({
  brandId,
  fipeModelCode,
  onUseValue,
}: FipeValueLookupProps) {
  const [aberto, setAberto] = useState(false);
  const [yearCode, setYearCode] = useState<string | null>(null);
  const [usado, setUsado] = useState(false);
  const yearFieldId = useId();

  const yearsQuery = useFipeYears(brandId, fipeModelCode, aberto);
  const valueQuery = useFipeEstimatedValue(
    brandId,
    fipeModelCode,
    yearCode,
    aberto,
  );

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex min-h-11 items-center self-start text-xs font-medium text-accent hover:underline"
      >
        Buscar valor de referência na FIPE
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={yearFieldId}>Ano na FIPE</Label>
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
            setUsado(false);
          }}
          placeholder="Escolha o ano"
          searchPlaceholder="Buscar ano…"
          emptyMessage="Nenhum ano disponível."
        />
        {yearsQuery.isError && <ErrorLine error={yearsQuery.error} />}
      </div>

      {valueQuery.isLoading && yearCode && (
        <p className="text-sm text-text-secondary">
          Consultando o valor na FIPE…
        </p>
      )}
      {valueQuery.isError && <ErrorLine error={valueQuery.error} />}

      {valueQuery.data && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-primary">
            Valor de referência:{" "}
            <span className="font-mono">
              {formatMoney(valueQuery.data.amount)}
            </span>
          </p>
          <p className="text-xs text-text-secondary">
            Tabela FIPE de {valueQuery.data.referenceMonth} · código{" "}
            {valueQuery.data.fipeCode}. É uma sugestão — o campo continua
            editável.
          </p>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => {
              onUseValue(valueQuery.data.amount);
              setUsado(true);
            }}
          >
            {usado ? "Valor preenchido" : "Usar como valor estimado"}
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAberto(false)}
        className="flex min-h-11 items-center self-start text-xs font-medium text-text-secondary hover:underline"
      >
        Fechar
      </button>
    </div>
  );
}
