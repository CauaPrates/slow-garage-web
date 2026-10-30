import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useCurrentVehicleId } from "@/hooks/useCurrentVehicleId";
import { useVehicle } from "@/features/vehicle/useVehicles";
import { ROUTES } from "@/lib/routes";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  /** Segmentos depois de "Garagem" e do nome do veículo, que este componente já resolve sozinho. O último nunca deveria ter `href` — é a página atual. */
  items: BreadcrumbSegment[];
};

function Separator() {
  return <ChevronRight aria-hidden="true" className="mx-1 h-3.5 w-3.5 shrink-0 text-border-strong" />;
}

function Crumb({ segment, isLast }: { segment: BreadcrumbSegment; isLast: boolean }) {
  if (segment.href && !isLast) {
    return (
      <Link
        to={segment.href}
        className="max-w-[16rem] truncate rounded-sm text-text-secondary transition-colors duration-(--duration-fast) hover:text-text-primary"
      >
        {segment.label}
      </Link>
    );
  }
  return (
    <span
      className={isLast ? "max-w-[16rem] truncate font-medium text-text-primary" : "max-w-[16rem] truncate text-text-secondary"}
      aria-current={isLast ? "page" : undefined}
    >
      {segment.label}
    </span>
  );
}

/** Fase 14: jeito de voltar de qualquer subtela de veículo sem depender da navegação global. Etapa 01: separador neutro (o laranja fica pra ação/estado) e segmento longo trunca em vez de quebrar a linha. */
export function Breadcrumb({ items }: BreadcrumbProps) {
  const vehicleId = useCurrentVehicleId();
  const { vehicle } = useVehicle(vehicleId ?? "");

  const segments: BreadcrumbSegment[] = [
    { label: "Garagem", href: ROUTES.home },
    ...(vehicleId && vehicle
      ? [{ label: `${vehicle.make} ${vehicle.model}`, href: ROUTES.vehicle(vehicleId) }]
      : []),
    ...items,
  ];

  return (
    <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center text-sm">
      {segments.map((segment, index) => (
        <span key={`${segment.label}-${index}`} className="flex min-w-0 items-center">
          {index > 0 && <Separator />}
          <Crumb segment={segment} isLast={index === segments.length - 1} />
        </span>
      ))}
    </nav>
  );
}
