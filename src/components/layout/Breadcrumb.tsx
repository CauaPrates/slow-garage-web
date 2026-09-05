import { Link } from "react-router-dom";
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
  return <span aria-hidden="true" className="mx-1.5 h-3 w-px shrink-0 bg-accent/60" />;
}

function Crumb({ segment, isLast }: { segment: BreadcrumbSegment; isLast: boolean }) {
  if (segment.href && !isLast) {
    return (
      <Link
        to={segment.href}
        className="rounded-sm text-text-secondary transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {segment.label}
      </Link>
    );
  }
  return (
    <span className={isLast ? "font-medium text-text-primary" : "text-text-secondary"} aria-current={isLast ? "page" : undefined}>
      {segment.label}
    </span>
  );
}

/** Fase 14: jeito de voltar de qualquer subtela de veículo sem depender da navegação global — separador fino âmbar, não `/`/`›` genérico. */
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
        <span key={`${segment.label}-${index}`} className="flex items-center">
          {index > 0 && <Separator />}
          <Crumb segment={segment} isLast={index === segments.length - 1} />
        </span>
      ))}
    </nav>
  );
}
