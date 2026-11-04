import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { formatKm, formatMoney } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { useExpenseCategories } from "@/features/expense/useExpenseCategories";
import { UploadPhotoDialog } from "@/features/photo/UploadPhotoDialog";
import type { Database } from "@/types/database.types";
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
  /** Posição na coleção (0, 1, 2…) — vira a numeração editorial "01", "02". Não é ID. */
  index: number;
  /** Buscado uma vez só em `VehicleListPage` (categoria não é por veículo) — repassado pra cada card. */
  categories: ReturnType<typeof useExpenseCategories>["data"];
};

type VehicleStatus = Database["public"]["Enums"]["vehicle_status"];

/**
 * Ponto do status. Nunca é o único sinal — o rótulo vem escrito ao lado.
 * Ativo em verde (em uso), Projeto no laranja da marca (é o assunto do app),
 * Guardado neutro, Vendido só com contorno (fora da garagem).
 */
const STATUS_DOT_CLASSNAME: Record<VehicleStatus, string> = {
  active: "bg-success",
  project: "bg-accent",
  stored: "bg-text-secondary",
  sold: "border border-text-secondary bg-transparent",
};

/** Indicador principal: valor claro em cima, rótulo embaixo (`dt` depois do `dd` só visualmente). */
function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="garage-card__metric">
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
 * Card de veículo — Garagem A3 (ADR-094): ficha editorial de revista.
 *
 * Uma marcação, três composições, decididas pela largura do próprio card
 * (`garage.css`, container query — não pela viewport):
 * - vertical (< 540 px, celular): foto, linha "01 · MARCA · status · ⋯",
 *   modelo, ano/versão/placa, os dois indicadores com a seta laranja ao lado,
 *   e a régua "Ficha técnica" + registros;
 * - spread compacto (540–999 px): foto 4:3 à esquerda, texto à direita, e a
 *   régua de ações embaixo com "Abrir veículo" escrito;
 * - spread largo (≥ 1000 px): foto | identificação + indicadores | ficha
 *   técnica aberta numa coluna; os registros ganham rótulo. A largura vira
 *   composição, não letra maior — modelo para em 24px.
 *
 * A numeração "01", "02" é a posição na coleção, decorativa (`aria-hidden`).
 * Indicadores fixos em todo card: Odômetro e Total investido. Nada some:
 * custo/km, gasto do mês, combustível, câmbio, motor e potência na ficha;
 * gasto, abastecimento, manutenção e foto na régua; editar e excluir no "⋯".
 *
 * Sem interativo dentro de interativo: o título é um link esticado
 * (`after:inset-0`) sobre o card, fora da ordem de tabulação; "Abrir veículo"
 * é o acesso explícito e o de teclado (existe em duas formas — seta no
 * vertical, rótulo no spread —, uma só visível por vez). Régua, ficha, seta e
 * "⋯" ficam acima do link (`z-10`). O "⋯" é o último no DOM (vem depois dos
 * registros na tabulação) e a grade o posiciona na linha do número.
 *
 * `relative overflow-hidden` também em utilitário (no card e na foto): se a
 * folha da Garagem faltar (CSS velho em cache, HMR), a foto e o link esticado
 * continuam presos ao card em vez de cobrir a página.
 */
export function VehicleCard({ vehicle, index, categories }: VehicleCardProps) {
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
    <article aria-labelledby={nameId} className="garage-card group relative overflow-hidden">
      <div className="garage-card__grid">
        <VehicleCardPhoto
          photoUrl={vehicle.photoUrl}
          vehicleNameId={nameId}
          onAddPhoto={() => setPhotoOpen(true)}
        />

        <div className="garage-card__head">
          <span className="garage-card__num" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          {/* Marca na linha do número só no card vertical; no spread ela desce para cima do modelo. */}
          <span className="garage-card__make" aria-hidden="true">
            {vehicle.make}
          </span>
          <span className="garage-card__rule" aria-hidden="true" />
          <span className="garage-card__status">
            <span
              aria-hidden="true"
              className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT_CLASSNAME[vehicle.status])}
            />
            <span className="sr-only">Status: </span>
            {VEHICLE_STATUS_LABELS[vehicle.status]}
          </span>
        </div>

        <div className="garage-card__body">
          <p className="garage-card__make" aria-hidden="true">
            {vehicle.make}
          </p>
          <h3 id={nameId} className="garage-card__model">
            {/*
              Fora da ordem de tabulação: o caminho de teclado é "Abrir
              veículo" — um destino, uma parada. Pra ponteiro e toque, o
              `after:` estica o link sobre o card.
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
                <span className="rounded-sm border border-border px-1.5 py-px font-mono text-xs tracking-wider">
                  <span className="sr-only">Placa </span>
                  {vehicle.plate}
                </span>
              )}
            </div>
          )}
          <div className="garage-card__figures">
            <dl className="garage-card__metrics">
              <Metric
                label="Odômetro"
                value={vehicle.current_odometer_km != null ? formatKm(vehicle.current_odometer_km) : null}
              />
              <Metric
                label="Total investido"
                value={summary?.total_invested != null ? formatMoney(summary.total_invested) : null}
              />
            </dl>
            {/* Card vertical: a seta laranja ao lado dos números. */}
            <Link
              to={ROUTES.vehicle(vehicle.id)}
              aria-label="Abrir veículo"
              aria-describedby={nameId}
              title="Abrir veículo"
              className="garage-card__go-square h-11 w-11 shrink-0 rounded-md bg-accent text-accent-foreground transition-colors duration-(--duration-fast) hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/*
          Ficha técnica: acordeão no vertical e no spread compacto (fechado por
          padrão); coluna aberta no spread largo, onde o botão some.
        */}
        <div id={specsId} className="garage-card__specs" data-open={detailsOpen ? "true" : "false"}>
          <p className="garage-card__specs-title" aria-hidden="true">
            Ficha técnica
          </p>
          <dl>
            {specs.map((spec) => (
              <div key={spec.label} className="min-w-0">
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="garage-card__foot">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={specsId}
            aria-describedby={nameId}
            className="garage-card__ficha-toggle min-h-11 gap-1 rounded-md px-1.5 text-[0.8125rem] font-medium text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary"
          >
            Ficha técnica
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
          {/* Spread: "Abrir veículo" escrito, com a seta laranja, no fim da régua. */}
          <Link
            to={ROUTES.vehicle(vehicle.id)}
            aria-describedby={nameId}
            className="garage-card__go group/go ml-auto min-h-11 gap-2.5 rounded-md pl-3 text-sm font-semibold whitespace-nowrap text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Abrir veículo
            <span className="flex h-9.5 w-9.5 items-center justify-center rounded-md bg-accent text-accent-foreground transition-colors duration-(--duration-fast) group-hover/go:bg-accent-hover">
              <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          </Link>
        </div>

        {/* Último no DOM (depois dos registros na tabulação); a grade o põe na linha do número. */}
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
