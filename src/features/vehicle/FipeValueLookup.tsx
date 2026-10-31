import { useId, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
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
 *
 * Etapa 03: a consulta é um painel rebaixado (`bg-bg`) com título próprio,
 * pra não se confundir com os campos de identificação acima nem com o
 * "Valor estimado atual", que é o valor salvo e mora em "Compra e valores".
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
  const titleId = useId();

  const yearsQuery = useFipeYears(brandId, fipeModelCode, aberto);
  const valueQuery = useFipeEstimatedValue(
    brandId,
    fipeModelCode,
    yearCode,
    aberto,
  );

  if (!aberto) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <Button type="button" variant="outline" onClick={() => setAberto(true)}>
          <Search className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          Consultar valor de referência FIPE
        </Button>
        <p className="text-xs text-text-secondary">
          Opcional. Só consulta — nada muda no cadastro sem você pedir.
        </p>
      </div>
    );
  }

  const semAnos = yearsQuery.isSuccess && yearsQuery.data.length === 0;

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h4 id={titleId} className="text-sm font-semibold text-text-primary">
            Referência FIPE
          </h4>
          <p className="text-xs text-text-secondary">
            Consulta à tabela, separada do valor estimado que você salva.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="-mt-2 -mr-2 shrink-0 px-3 text-text-secondary"
          onClick={() => setAberto(false)}
        >
          Fechar
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor={yearFieldId}>Ano do modelo na FIPE</Label>
        <Combobox
          id={yearFieldId}
          options={(yearsQuery.data ?? []).map((year) => ({
            value: year.code,
            label: year.name,
          }))}
          value={yearCode}
          loading={yearsQuery.isLoading}
          disabled={yearsQuery.isError || semAnos}
          onChange={(code) => {
            setYearCode(code);
            setUsado(false);
          }}
          placeholder="Escolha o ano"
          searchPlaceholder="Buscar ano…"
          emptyMessage="Nenhum ano disponível."
        />
        {yearsQuery.isError && <ErrorLine error={yearsQuery.error} />}
        {semAnos && (
          <p className="text-sm text-text-secondary">
            A FIPE não lista anos para este modelo. Preencha o valor à mão, se
            quiser.
          </p>
        )}
      </div>

      {valueQuery.isLoading && yearCode && (
        <p role="status" className="flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
          Consultando o valor na FIPE…
        </p>
      )}
      {valueQuery.isError && <ErrorLine error={valueQuery.error} />}

      {valueQuery.data && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-text-secondary">
              Valor de referência · tabela de {valueQuery.data.referenceMonth}
            </p>
            <p className="font-mono text-xl text-text-primary">
              {formatMoney(valueQuery.data.amount)}
            </p>
            <p className="text-xs text-text-secondary">
              Código FIPE {valueQuery.data.fipeCode}. É uma referência de
              mercado para o modelo e o ano, não uma avaliação deste veículo.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onUseValue(valueQuery.data.amount);
                setUsado(true);
              }}
            >
              {usado && <Check className="h-4 w-4 text-success" aria-hidden="true" />}
              {usado ? "Usado como valor estimado" : "Usar como valor estimado"}
            </Button>
            <p role="status" className="text-xs text-text-secondary">
              {usado &&
                "Copiado para “Valor estimado atual”, em Compra e valores. Você pode editar ou apagar antes de salvar."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
