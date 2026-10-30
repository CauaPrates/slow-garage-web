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
  /** Número da baia (1-based) — mostrado tipo placa de vaga de oficina, não é um dado do banco. */
  bayNumber: number;
  /** Buscado uma vez só em `VehicleListPage` (categoria não é por veículo) — repassado pra cada card. */
  categories: ReturnType<typeof useExpenseCategories>["data"];
};

/** `mono` só pra número de medição (km, R$) — texto como "Gasolina" fica na fonte de interface (DESIGN.md, Tipografia). */
function Spec({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className={cn("text-sm break-words text-text-primary", mono && "font-mono")}>
        {value}
      </dd>
    </div>
  );
}

/** `null` vira "—" (a view não calculou); zero continua zero. */
function moneyOrDash(value: number | null | undefined) {
  return value != null ? formatMoney(value) : "—";
}

/**
 * Redesign etapa 02: o card volta a ser vertical, com a foto como
 * protagonista (a "baia" horizontal da Fase 14c deixava a foto numa faixa
 * estreita ao lado da ficha). Continua sem aninhar interativo dentro de
 * interativo: o título é um link esticado (`after:inset-0`) só sobre a zona
 * da foto + identificação, e "Abrir veículo" é o acesso explícito (e o de
 * teclado). A ficha, a faixa de registros e o menu ficam fora dessa zona —
 * tocar nelas nunca abre o veículo por engano.
 *
 * O que fica sempre visível: foto, marca/modelo, ano e versão, placa,
 * status (sobre a foto), km e o gasto do mês atual (`current_month_spend`, mês corrente na
 * view). Custo/km, total investido, combustível e especificações ficam na
 * "Ficha técnica", que expande em qualquer largura.
 */
export function VehicleCard({
  vehicle,
  bayNumber,
  categories,
}: VehicleCardProps) {
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

  const optionalSpecs = [
    vehicle.engine_description
      ? { label: "Motor", value: vehicle.engine_description }
      : null,
    vehicle.horsepower != null
      ? { label: "Potência", value: `${vehicle.horsepower} cv` }
      : null,
  ].filter((spec): spec is { label: string; value: string } => spec != null);

  return (
    <article
      aria-labelledby={nameId}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-(--duration-fast) hover:border-border-strong"
    >
      {/* Zona clicável: o `after:` do link do título cobre foto + identificação. */}
      <div className="relative">
        <VehicleCardPhoto
          photoUrl={vehicle.photoUrl}
          bayNumber={bayNumber}
          vehicleNameId={nameId}
          onAddPhoto={() => setPhotoOpen(true)}
          statusBadge={
            <span
              className={cn(
                "rounded-sm border bg-bg px-1.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
                vehicle.status === "active"
                  ? "border-accent/40 text-accent"
                  : "border-border text-text-secondary",
              )}
            >
              <span className="sr-only">Status: </span>
              {VEHICLE_STATUS_LABELS[vehicle.status]}
            </span>
          }
        />

        <div className="flex flex-col gap-1 px-4 pt-3">
          <p className="truncate text-[11px] font-medium tracking-[0.08em] text-text-secondary uppercase">
            {vehicle.make}
          </p>
          <h3 id={nameId} className="text-lg leading-tight font-semibold tracking-tight break-words text-text-primary">
            {/*
              Fora da ordem de tabulação: o caminho de teclado é o "Abrir
              veículo" explícito abaixo — um destino, uma parada. Pra ponteiro
              e toque, o `after:` estica o link sobre foto + identificação.
            */}
            <Link
              to={ROUTES.vehicle(vehicle.id)}
              tabIndex={-1}
              className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-border-strong group-hover:underline-offset-4"
            >
              {/* A marca já aparece logo acima; aqui ela fica só pro leitor de tela, pro nome do link ser o veículo inteiro. */}
              <span className="sr-only">{vehicle.make} </span>
              {vehicle.model}
            </Link>
          </h3>
          {(subtitle.length > 0 || vehicle.plate) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
              {subtitle.length > 0 && <span>{subtitle.join(" · ")}</span>}
              {vehicle.plate && (
                <span className="rounded-sm border border-border px-1.5 py-px font-mono text-xs tracking-wider">
                  <span className="sr-only">Placa </span>
                  {vehicle.plate}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <dl className="mx-4 mt-3 grid grid-cols-2 gap-3 border-t border-border pt-2.5">
        <Spec
          label="Km"
          mono
          value={
            vehicle.current_odometer_km != null
              ? formatKm(vehicle.current_odometer_km)
              : "—"
          }
        />
        <Spec
          label="Gasto no mês atual"
          mono
          value={moneyOrDash(summary?.current_month_spend)}
        />
      </dl>

      {/*
        Acordeão no padrão do app (DESIGN.md, "Densidade"): `aria-expanded`
        + `aria-controls`, alvo de 44px. Fica fora da zona do link, então
        abrir a ficha nunca navega.
      */}
      <div className="px-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={specsId}
            aria-describedby={nameId}
            className="-ml-1 flex min-h-11 items-center gap-1.5 px-1 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Ficha técnica
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-150",
                detailsOpen && "rotate-180",
              )}
            />
          </button>
          {/* Acesso explícito ao painel do veículo — não depende de descobrir que a foto é clicável. */}
          <Link
            to={ROUTES.vehicle(vehicle.id)}
            aria-describedby={nameId}
            className="-mr-1 flex min-h-11 items-center gap-1 rounded-md px-1 text-sm font-medium text-text-primary hover:underline hover:decoration-border-strong hover:underline-offset-4"
          >
            Abrir veículo
            {/* Só a seta no acento: o laranja repetido em todo card viraria decoração. */}
            <ArrowRight className="h-4 w-4 text-accent" aria-hidden="true" />
          </Link>
        </div>
        <dl
          id={specsId}
          hidden={!detailsOpen}
          className="grid grid-cols-2 gap-3 pb-3"
        >
          <Spec
            label="Custo/km"
            mono
            value={
              summary?.cost_per_km != null
                ? `${formatMoney(summary.cost_per_km)}/km`
                : "—"
            }
          />
          <Spec
            label="Total investido"
            mono
            value={moneyOrDash(summary?.total_invested)}
          />
          <Spec label="Combustível" value={FUEL_TYPE_LABELS[vehicle.fuel_type]} />
          <Spec label="Câmbio" value={TRANSMISSION_LABELS[vehicle.transmission]} />
          {optionalSpecs.map((spec) => (
            <Spec key={spec.label} label={spec.label} value={spec.value} />
          ))}
        </dl>
      </div>

      <div className="mt-auto flex items-center gap-0.5 border-t border-border px-2 py-1">
        <VehicleQuickActions
          vehicleId={vehicle.id}
          vehicleNameId={nameId}
          categories={categories}
          defaultFuelType={vehicle.fuel_type}
          defaultOdometerKm={vehicle.current_odometer_km ?? undefined}
          onAddPhoto={() => setPhotoOpen(true)}
        />
        <div className="ml-auto">
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
