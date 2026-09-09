import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FipeError, type FipeYear } from "@/lib/fipe/fipeExternal";
import { EditVehicleDialog } from "./EditVehicleDialog";
import { useFipeEstimatedValue, useFipeModel, useFipeYears } from "./useFipe";
import { useUpdateVehicle, type VehicleWithSummary } from "./useVehicles";

type VehicleFipeCardProps = { vehicle: VehicleWithSummary };

/**
 * A FIPE separa o mesmo ano por combustível ("2013 Gasolina", "2013 Álcool"),
 * e o carro flex costuma aparecer como Gasolina. Palpite, não certeza — por
 * isso o ano escolhido é **mostrado na tela**: quem conhece o próprio carro
 * enxerga na hora se pegamos a linha errada.
 */
const FUEL_HINTS: Record<string, string[]> = {
  gasoline: ["gasolina"],
  ethanol: ["álcool"],
  // A FIPE às vezes lista o flex como "Flex", às vezes como "Gasolina" —
  // por isso a segunda pista, na ordem de preferência.
  flex: ["flex", "gasolina"],
  diesel: ["diesel"],
};

function pickYear(
  years: FipeYear[],
  modelYear: number,
  fuelType: string | null,
): FipeYear | null {
  const doAno = years.filter((year) => year.code.startsWith(`${modelYear}-`));
  if (doAno.length === 0) return null;
  for (const pista of (fuelType && FUEL_HINTS[fuelType]) || []) {
    const achado = doAno.find((year) =>
      year.name.toLowerCase().includes(pista),
    );
    if (achado) return achado;
  }
  return doAno[0];
}

/** Caixa comum às variações, pra que loading, erro e sucesso ocupem o mesmo lugar. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="fipe-card-titulo"
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
    >
      <h2 id="fipe-card-titulo" className="text-xs text-text-secondary">
        Valor na tabela FIPE
      </h2>
      {children}
    </section>
  );
}

/**
 * Fase 027: o valor de referência da FIPE no painel do veículo, com um botão
 * pra reconsultar quando a pessoa quiser.
 *
 * Só aparece completo quando o veículo foi **identificado** na FIPE (marca e
 * modelo escolhidos da lista, na Fase 026) e tem ano de modelo — sem esses
 * três dados não há linha da tabela pra consultar, e adivinhar seria pior do
 * que dizer o que falta.
 *
 * O valor é da FIPE, não nosso (RN-1): entra na tela com o mês de referência
 * e o ano usados, e **nunca** sobrescreve sozinho o valor estimado do
 * veículo. Quando os dois divergem, o card oferece a troca; quem decide é o
 * dono do carro, porque esse número alimenta o resumo financeiro.
 */
export function VehicleFipeCard({ vehicle }: VehicleFipeCardProps) {
  const [editando, setEditando] = useState(false);

  const modelQuery = useFipeModel(vehicle.fipe_model_id);
  const fipeModelCode = modelQuery.data?.fipeModelCode ?? null;
  const identificado =
    vehicle.fipe_brand_id != null && vehicle.fipe_model_id != null;

  const yearsQuery = useFipeYears(
    vehicle.fipe_brand_id,
    fipeModelCode,
    identificado && vehicle.model_year != null,
  );
  const ano =
    yearsQuery.data && vehicle.model_year != null
      ? pickYear(yearsQuery.data, vehicle.model_year, vehicle.fuel_type)
      : null;

  const valueQuery = useFipeEstimatedValue(
    vehicle.fipe_brand_id,
    fipeModelCode,
    ano?.code ?? null,
    identificado,
  );

  const updateVehicle = useUpdateVehicle();

  if (!identificado) {
    return (
      <>
        <Card>
          <p className="text-sm text-text-secondary">
            Este veículo não está identificado na FIPE. Escolha a marca e o
            modelo pela lista para ver o valor de referência.
          </p>
          <Button
            variant="outline"
            className="self-start"
            onClick={() => setEditando(true)}
          >
            Identificar na FIPE
          </Button>
        </Card>
        <EditVehicleDialog
          vehicle={vehicle}
          open={editando}
          onOpenChange={setEditando}
        />
      </>
    );
  }

  if (vehicle.model_year == null) {
    return (
      <>
        <Card>
          <p className="text-sm text-text-secondary">
            A FIPE cobra o ano do modelo para achar o valor, e este veículo
            está sem ele.
          </p>
          <Button
            variant="outline"
            className="self-start"
            onClick={() => setEditando(true)}
          >
            Informar o ano
          </Button>
        </Card>
        <EditVehicleDialog
          vehicle={vehicle}
          open={editando}
          onOpenChange={setEditando}
        />
      </>
    );
  }

  const carregando =
    modelQuery.isLoading || yearsQuery.isLoading || valueQuery.isLoading;
  const erro = modelQuery.error ?? yearsQuery.error ?? valueQuery.error;
  const consultando = yearsQuery.isFetching || valueQuery.isFetching;

  const atualizar = () => {
    void yearsQuery.refetch();
    void valueQuery.refetch();
  };

  // Fica colado no valor de propósito: é o valor daquele número que a pessoa
  // quer reconferir, e no desktop um botão no canto do card ficaria a meia
  // tela de distância do que ele atualiza.
  const botaoAtualizar = (
    <button
      type="button"
      onClick={atualizar}
      disabled={consultando}
      aria-label="Atualizar valor da FIPE"
      className="-my-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed"
    >
      <RefreshCw
        aria-hidden="true"
        className={cn("h-4 w-4", consultando && "motion-safe:animate-spin")}
      />
    </button>
  );

  if (carregando) {
    return (
      <Card>
        <div className="h-7 w-40 animate-pulse rounded bg-bg" />
        <div className="h-4 w-56 animate-pulse rounded bg-bg" />
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <p role="alert" className="flex items-start gap-2 text-sm text-error">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {erro instanceof FipeError
            ? erro.message
            : "Não foi possível consultar a FIPE agora."}
        </p>
        <Button variant="ghost" className="self-start" onClick={atualizar}>
          Tentar de novo
        </Button>
      </Card>
    );
  }

  if (ano == null) {
    return (
      <Card>
        <p className="text-sm text-text-secondary">
          A FIPE não tem o ano {vehicle.model_year} para este modelo.
        </p>
      </Card>
    );
  }

  const valor = valueQuery.data;
  if (!valor) return null;

  const estimado = vehicle.estimated_current_value;
  const divergente = estimado != null && Math.abs(estimado - valor.amount) >= 1;

  return (
    <Card>
      {/*
        Dois módulos separados por 1px, no mesmo idioma do painel da garagem
        (ADR-070): à esquerda o que a FIPE diz, à direita como isso se compara
        ao que está gravado no veículo.
      */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <p className="font-mono text-2xl font-medium text-text-primary">
              {formatMoney(valor.amount)}
            </p>
            {botaoAtualizar}
          </div>
          <p className="text-xs text-text-secondary">
            Tabela de {valor.referenceMonth} · {ano.name} · código{" "}
            {valor.fipeCode}
          </p>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          {estimado == null ? (
            <>
              <p className="text-xs text-text-secondary">
                Este veículo ainda não tem valor estimado.
              </p>
              <Button
                variant="outline"
                disabled={updateVehicle.isPending}
                onClick={() =>
                  updateVehicle.mutate({
                    id: vehicle.id,
                    estimated_current_value: valor.amount,
                  })
                }
              >
                Usar como valor estimado
              </Button>
            </>
          ) : divergente ? (
            <>
              <p className="text-xs text-text-secondary">
                Seu valor estimado é{" "}
                <span className="font-mono text-text-primary">
                  {formatMoney(estimado)}
                </span>
                , {estimado < valor.amount ? "abaixo" : "acima"} da FIPE.
              </p>
              <Button
                variant="outline"
                disabled={updateVehicle.isPending}
                onClick={() =>
                  updateVehicle.mutate({
                    id: vehicle.id,
                    estimated_current_value: valor.amount,
                  })
                }
              >
                Atualizar para o valor da FIPE
              </Button>
            </>
          ) : (
            <p className="text-xs text-text-secondary">
              Seu valor estimado está igual ao da FIPE.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
