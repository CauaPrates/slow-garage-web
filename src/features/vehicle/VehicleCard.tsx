import { useId, useState, type ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, Gauge, Wallet } from "lucide-react";
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
  /** Buscado uma vez só em `VehicleListPage` (categoria não é por veículo) — repassado pra cada card. */
  categories: ReturnType<typeof useExpenseCategories>["data"];
};

type VehicleStatus = Database["public"]["Enums"]["vehicle_status"];

/**
 * Ponto do selo de status. Nunca é o único sinal — o rótulo vem escrito ao
 * lado. Ativo em verde (em uso), Projeto no laranja da marca (é o assunto do
 * app), Guardado neutro, Vendido só com contorno (fora da garagem).
 */
const STATUS_DOT_CLASSNAME: Record<VehicleStatus, string> = {
  active: "bg-success",
  project: "bg-accent",
  stored: "bg-text-secondary",
  sold: "border border-text-secondary bg-transparent",
};

/** Item da ficha técnica: rótulo pequeno, valor na fonte de interface com algarismos tabulares (`dd`). */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-sm font-medium break-words text-text-primary">{value}</dd>
    </div>
  );
}

/** Indicador principal do card: ícone discreto, valor claro, rótulo embaixo. Quebra linha em vez de cortar. */
function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  label: string;
  value: string;
}) {
  // `dt`/`dd` são filhos diretos do `div` (regra de `dl`); o ícone mora dentro do `dd`, na coluna da esquerda.
  return (
    <div className="relative flex min-w-0 flex-col-reverse min-[400px]:pl-6.5">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-[0.9375rem] leading-snug font-semibold break-words text-text-primary">
        <Icon className="absolute top-0.5 left-0 hidden h-4.5 w-4.5 text-text-secondary min-[400px]:block" aria-hidden="true" />
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
 * Card de veículo — recalibração visual 01 (referência "Dashboard Garage
 * Automotiva em Tema Escuro"): a foto é o elemento principal, a marca fica
 * discreta e o modelo ganha peso e tamanho (fonte display), com ano/versão e
 * placa numa linha secundária. Dois indicadores fixos em todo card —
 * odômetro e total investido — e a seta laranja de abrir o veículo, a única
 * cor de marca do card.
 *
 * Continua sem aninhar interativo dentro de interativo: o título é um link
 * esticado (`after:inset-0`) só sobre a zona da foto + identificação, fora da
 * ordem de tabulação; a seta "Abrir veículo" é o acesso explícito (e o de
 * teclado). Indicadores, ficha, registros e menu ficam fora dessa zona.
 *
 * Nada some: custo/km, gasto do mês atual, combustível, câmbio, motor e
 * potência estão na "Ficha técnica"; registrar gasto, abastecimento,
 * manutenção e foto na faixa de baixo; editar e excluir no "⋯".
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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-(--duration-fast) hover:border-border-strong"
    >
      {/* Zona clicável: o `after:` do link do título cobre foto + identificação. */}
      <div className="relative">
        <VehicleCardPhoto
          photoUrl={vehicle.photoUrl}
          vehicleNameId={nameId}
          onAddPhoto={() => setPhotoOpen(true)}
          statusBadge={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-medium text-text-primary">
              <span
                aria-hidden="true"
                className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT_CLASSNAME[vehicle.status])}
              />
              <span className="sr-only">Status: </span>
              {VEHICLE_STATUS_LABELS[vehicle.status]}
            </span>
          }
        />

        <div className="flex flex-col px-4 pt-2 pb-4">
          <p className="truncate text-[0.8125rem] font-medium text-text-secondary">{vehicle.make}</p>
          <h3
            id={nameId}
            className="mt-0.5 font-display text-[1.375rem] leading-[1.1] font-extrabold tracking-tight break-words text-text-primary"
          >
            {/*
              Fora da ordem de tabulação: o caminho de teclado é a seta "Abrir
              veículo" abaixo — um destino, uma parada. Pra ponteiro e toque, o
              `after:` estica o link sobre foto + identificação.
            */}
            <Link
              to={ROUTES.vehicle(vehicle.id)}
              tabIndex={-1}
              className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-border-strong group-hover:decoration-2 group-hover:underline-offset-4"
            >
              {/* A marca já aparece logo acima; aqui ela fica só pro leitor de tela, pro nome do link ser o veículo inteiro. */}
              <span className="sr-only">{vehicle.make} </span>
              {vehicle.model}
            </Link>
          </h3>
          {(subtitle.length > 0 || vehicle.plate) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-text-secondary">
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

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <dl className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-3">
          <Metric
            icon={Gauge}
            label="Odômetro"
            value={vehicle.current_odometer_km != null ? formatKm(vehicle.current_odometer_km) : "—"}
          />
          <Metric icon={Wallet} label="Total investido" value={moneyOrDash(summary?.total_invested)} />
        </dl>
        {/* Acesso explícito ao painel do veículo — não depende de descobrir que a foto é clicável. */}
        <Link
          to={ROUTES.vehicle(vehicle.id)}
          aria-label="Abrir veículo"
          aria-describedby={nameId}
          title="Abrir veículo"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground transition-colors duration-(--duration-fast) hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {/*
        Acordeão no padrão do app: `aria-expanded` + `aria-controls`, alvo de
        44px. Fica fora da zona do link, então abrir a ficha nunca navega.
      */}
      <div className="mt-auto flex flex-wrap items-center gap-0.5 border-t border-border px-1">
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          aria-controls={specsId}
          aria-describedby={nameId}
          className="flex min-h-11 items-center gap-1 rounded-md px-1.5 text-[0.8125rem] font-medium text-text-secondary transition-colors duration-(--duration-fast) hover:bg-state-hover hover:text-text-primary"
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
        <div className="ml-auto flex items-center">
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

      <dl
        id={specsId}
        hidden={!detailsOpen}
        className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border px-4 py-3"
      >
        <Spec
          label="Custo/km"
          value={summary?.cost_per_km != null ? `${formatMoney(summary.cost_per_km)}/km` : "—"}
        />
        <Spec label="Gasto no mês atual" value={moneyOrDash(summary?.current_month_spend)} />
        <Spec label="Combustível" value={FUEL_TYPE_LABELS[vehicle.fuel_type]} />
        <Spec label="Câmbio" value={TRANSMISSION_LABELS[vehicle.transmission]} />
        {optionalSpecs.map((spec) => (
          <Spec key={spec.label} label={spec.label} value={spec.value} />
        ))}
      </dl>

      {/*
        "Mais ações" (editar, excluir) no canto da foto, como na referência — fora
        da zona do link (z-10) e por último no DOM: na tabulação vem depois dos
        registros, a ordem de sempre. Fundo sólido pra contrastar com qualquer foto.
      */}
      <div className="absolute top-2 right-2 z-10">
        <VehicleCardMenu
          vehicle={vehicle}
          vehicleNameId={nameId}
          triggerClassName="rounded-full border border-border bg-bg text-text-primary hover:bg-surface-raised"
        />
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
