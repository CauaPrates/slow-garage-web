import { cn } from "@/lib/utils";

/**
 * Harmonização 01: a placa como etiqueta pequena (sidebar, troca de veículo,
 * cabeçalho do dashboard) — a mesma em três lugares. Monoespaçada porque é
 * identificador, e é um dos dois únicos usos de mono que ficam (o outro é a
 * placa Mercosul do card da Garagem, desenhada em garage.css).
 */
export function PlateTag({ plate, className }: { plate: string; className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-sm border border-border px-1.5 py-px font-mono text-[0.6875rem] tracking-wider whitespace-nowrap",
        className,
      )}
    >
      <span className="sr-only">Placa </span>
      {plate}
    </span>
  );
}
