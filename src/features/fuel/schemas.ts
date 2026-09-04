import { z } from "zod";
import {
  optionalEnum,
  optionalNonNegativeInt,
  optionalText,
  requiredNonNegativeNumber,
} from "@/lib/schemaHelpers";
import { FUEL_TYPES } from "@/features/vehicle/schemas";

export const fuelLogSchema = z.object({
  // Obrigatórios visíveis
  odometerKm: optionalNonNegativeInt("a quilometragem"),
  liters: requiredNonNegativeNumber("os litros"),
  totalAmount: requiredNonNegativeNumber("o valor total"),
  isFullTank: z.boolean(),

  // "Mais detalhes" — pré-preenchidos, editáveis
  occurredOn: optionalText,
  fuelType: optionalEnum(FUEL_TYPES),
  station: optionalText,
  missedPreviousFill: z.boolean(),
  notes: optionalText,
});

export type FuelLogFormInput = z.input<typeof fuelLogSchema>;
export type FuelLogFormOutput = z.output<typeof fuelLogSchema>;
