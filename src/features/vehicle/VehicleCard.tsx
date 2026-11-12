import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { formatKm, formatMoney } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { UploadPhotoDialog } from "@/features/photo/UploadPhotoDialog";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_STATUS_LABELS,
} from "./schemas";
import { VehicleCardMenu } from "./VehicleCardMenu";
import { VehicleCardPhoto } from "./VehicleCardPhoto";
import { VehicleQuickActions } from "./VehicleQuickActions";
import type { VehicleWithSummary } from "./useVehicles";

type VehicleCardProps = {
  vehicle: VehicleWithSummary;
  /** Buscado uma vez só em `VehicleListPage` (categoria não é por veículo) — repassado pra cada card. */
  categories: ReturnType<typeof useExpenseCategories>["data"];
};

/**
 * Indicador principal: ícone à esquerda, valor claro em cima, rótulo embaixo
 * (`dt` depois do `dd` só visualmente). O ícone é desenhado em CSS
 * (`data-icon`) — dentro de <dl> só cabem <dt>/<dd>.
 */
function Metric({ label, value, icon }: { label: string; value: string | null; icon: "odometer" | "money" }) {
  return (
    <div className="garage-card__metric" data-icon={icon}>
      <dt>{label}</dt>
      <dd data-missing={value == null ? "" : undefined}>{value ?? "—"}</dd>
    </div>
  );
}

/** `null` vira "—" (a view não calculou); zero continua zero. */
function moneyOrDash(value: number | null | undefined) {
  return value != null ? formatMoney(value) : "—";
}

/**
 * Card de veículo da Minha garagem — revisão dos cards A3 (ADR-095), mais
 * perto da referência original: **vertical em toda largura**, sem número
 * editorial e sem coluna técnica aberta.
 *
 * 1. Foto 16:10 na largura toda, com o status (pílula escura) no canto
 *    superior esquerdo e o "⋯" no direito — também sem foto ou com falha.
 * 2. Identificação: marca discreta, modelo em destaque (quebra e fica
 *    completo), ano · versão e placa.
 * 3. Odômetro e Total investido com a seta laranja "Abrir veículo" à direita.
 * 4. Faixa secundária: "Ficha técnica" (recolhida por padrão; abre embaixo)
 *    e os quatro registros (gasto, abastecimento, manutenção, foto).
 *
 * A grade (`garage.css`) decide colunas e largura; o card não muda de
 * composição. Nada some: custo/km, gasto do mês, combustível, câmbio, motor e
 * potência na ficha; editar e excluir no "⋯".
 *
 * Sem interativo dentro de interativo: o título é um link esticado
 * (`after:inset-0`) sobre o card — a foto e o selo de status abrem o veículo
 * por ele —, fora da ordem de tabulação; a seta é o acesso de teclado (uma
 * parada por destino). Seta, faixa, ficha e "⋯" ficam acima do link
 * (`z-10`). O "⋯" é o último no DOM (vem depois dos registros na tabulação,
 * como antes) e a grade o põe sobre a foto.
 */
export function VehicleCard({ vehicle, categories }: VehicleCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const navigate = useNavigate();
  const nameId = useId();
  const specsId = useId();
  const summary = vehicle.financialSummary;
  const subtitle = [
    vehicle.model_year != null ? String(vehicle.model_year) : null,
    vehicle.trim,
  ].filter((part): part is string => Boolean(part));

  const specs = [
    {
      label: "Custo/km",
      value: summary?.cost_per_km != null ? `${formatMoney(summary.cost_per_km)}/km` : "—",
    },
    { label: "Gasto no mês atual", value: moneyOrDash(summary?.current_month_spend) },
    { label: "Combustível", value: FUEL_TYPE_LABELS[vehicle.fuel_type] },
    { label: "Câmbio", value: TRANSMISSION_LABELS[vehicle.transmission] },
    vehicle.engine_description ? { label: "Motor", value: vehicle.engine_description } : null,
    vehicle.horsepower != null ? { label: "Potência", value: `${vehicle.horsepower} cv` } : null,
  ].filter((spec): spec is { label: string; value: string } => spec != null);

  return (
    <article aria-labelledby={nameId} className="garage-card group relative">
      <div className="garage-card__grid">
        <VehicleCardPhoto
          photoUrl={vehicle.photoUrl}
          vehicleNameId={nameId}
          onAddPhoto={() => setPhotoOpen(true)}
        />

        {/* Sobre a foto (mesma área da grade), canto superior esquerdo. */}
        <span className="garage-card__status">
          <span aria-hidden="true" className="garage-card__dot" data-status={vehicle.status} />
          <span className="sr-only">Status: </span>
          {VEHICLE_STATUS_LABELS[vehicle.status]}
        </span>

        <div className="garage-card__body">
          <p className="garage-card__make" aria-hidden="true">
            {vehicle.make}
          </p>
          <h3 id={nameId} className="garage-card__model">
            {/*
              Fora da ordem de tabulação: o caminho de teclado é a seta "Abrir
              veículo" — um destino, uma parada. Pra ponteiro e toque, o
              `after:` estica o link sobre o card (foto inclusive).
            */}
            <Link
              to={ROUTES.vehicle(vehicle.id)}
              tabIndex={-1}
              className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-border-strong group-hover:decoration-2 group-hover:underline-offset-4"
            >
              {/* A marca aparece acima só para quem vê; aqui ela entra pro nome do link ser o veículo inteiro. */}
              <span className="sr-only">{vehicle.make} </span>
              {vehicle.model}
            </Link>
          </h3>
          {(subtitle.length > 0 || vehicle.plate) && (
            <div className="garage-card__sub">
              {subtitle.length > 0 && <span>{subtitle.join(" · ")}</span>}
              {vehicle.plate && (
                /* Placa no padrão Mercosul (ADR-097): chapa branca, faixa azul, caracteres pretos. */
                <span className="garage-plate">
                  <span className="sr-only">Placa </span>
                  {vehicle.plate}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="garage-card__figures">
          <dl className="garage-card__metrics">
            <Metric
              label="Odômetro"
              icon="odometer"
              value={vehicle.current_odometer_km != null ? formatKm(vehicle.current_odometer_km) : null}
            />
            <Metric
              label="Total investido"
              icon="money"
              value={summary?.total_invested != null ? formatMoney(summary.total_invested) : null}
            />
          </dl>
          <Link
            to={ROUTES.vehicle(vehicle.id)}
            aria-label="Abrir veículo"
            aria-describedby={nameId}
            data-tip="Abrir veículo"
            className="garage-card__go h-11 w-11 rounded-md bg-accent text-accent-foreground transition-colors duration-(--duration-fast) hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        <div className="garage-card__foot">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={specsId}
            aria-describedby={nameId}
            className="garage-card__ficha-toggle min-h-11 gap-1 rounded-md px-2 text-[0.8125rem] font-medium text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary"
          >
            {/* No card de 320px " técnica" sai da vista (continua no nome acessível) para a faixa caber numa linha. */}
            Ficha<span className="garage-card__ficha-more"> técnica</span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-4 w-4 motion-safe:transition-transform motion-safe:duration-150",
                detailsOpen && "rotate-180",
              )}
            />
          </button>
          <div className="garage-card__actions">
            <VehicleQuickActions
              vehicleId={vehicle.id}
              vehicleNameId={nameId}
              categories={categories}
              defaultFuelType={vehicle.fuel_type}
              defaultOdometerKm={vehicle.current_odometer_km ?? undefined}
              onAddPhoto={() => setPhotoOpen(true)}
            />
          </div>
        </div>

        {/* Ficha técnica: recolhida por padrão em toda largura; abre embaixo da faixa. */}
        <div id={specsId} className="garage-card__specs" data-open={detailsOpen ? "true" : "false"}>
          <dl>
            {specs.map((spec) => (
              <div key={spec.label} className="min-w-0">
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Último no DOM (depois dos registros na tabulação); a grade o põe sobre a foto, à direita. */}
        <div className="garage-card__menu">
          <VehicleCardMenu vehicle={vehicle} vehicleNameId={nameId} />
        </div>
      </div>

      {/* Foto enviada daqui só é vista na galeria do veículo — leva o usuário até ela (ADR-080). */}
      <UploadPhotoDialog
        vehicleId={vehicle.id}
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        onUploaded={() => navigate(ROUTES.vehiclePhotos(vehicle.id))}
      />
    </article>
  );
}
