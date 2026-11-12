import { FUEL_TYPE_LABELS } from "@/features/vehicle/schemas";
import type { FuelLogMetric } from "./useFuelLogs";

/**
 * Etapa 06: por que um abastecimento ficou sem consumo. O número continua
 * vindo só de `fuel_log_metrics.km_per_liter` — aqui nada é calculado. A
 * ordem das perguntas segue o `case` da view, então o motivo bate com a
 * regra que deixou o valor nulo:
 *
 * - sem odômetro: a diferença de km é nula;
 * - sem anterior com km (`km_since_previous` nulo): primeiro registro;
 * - abastecimento anterior não registrado;
 * - este tanque não foi completado;
 * - o restante (este cheio, anterior conhecido, nada perdido) só fica nulo
 *   quando o tanque **anterior** não foi completado.
 *
 * `null` quando há consumo. `taggedOnRow` diz se a linha já mostra o motivo
 * como etiqueta ("Tanque parcial", "Anterior não registrado").
 */
export function missingConsumptionReason(log: FuelLogMetric): { label: string; taggedOnRow: boolean } | null {
  if (log.km_per_liter != null) return null;
  if (log.odometer_km == null) return { label: "sem quilometragem", taggedOnRow: false };
  if (log.km_since_previous == null) return { label: "primeiro com km", taggedOnRow: false };
  if (log.missed_previous_fill) return { label: "anterior não registrado", taggedOnRow: true };
  if (!log.is_full_tank) return { label: "tanque parcial", taggedOnRow: true };
  return { label: "anterior parcial", taggedOnRow: false };
}

/** Combustível do registro pelo rótulo do app; o banco sempre grava um (default `other`). */
export function fuelTypeLabel(log: FuelLogMetric): string | null {
  return log.fuel_type ? FUEL_TYPE_LABELS[log.fuel_type] : null;
}
