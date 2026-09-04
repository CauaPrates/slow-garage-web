import { z } from "zod";
import {
  optionalEnum,
  optionalNonNegativeInt,
  optionalNonNegativeNumber,
  optionalText,
} from "@/lib/schemaHelpers";

export const FUEL_TYPES = [
  "gasoline",
  "ethanol",
  "flex",
  "diesel",
  "electric",
  "hybrid",
  "other",
] as const;

export const FUEL_TYPE_LABELS: Record<(typeof FUEL_TYPES)[number], string> = {
  gasoline: "Gasolina",
  ethanol: "Etanol",
  flex: "Flex",
  diesel: "Diesel",
  electric: "Elétrico",
  hybrid: "Híbrido",
  other: "Outro",
};

export const TRANSMISSIONS = ["manual", "automatic", "cvt", "other"] as const;

export const TRANSMISSION_LABELS: Record<(typeof TRANSMISSIONS)[number], string> = {
  manual: "Manual",
  automatic: "Automático",
  cvt: "CVT",
  other: "Outro",
};

export const VEHICLE_STATUSES = ["active", "project", "stored", "sold"] as const;

export const VEHICLE_STATUS_LABELS: Record<(typeof VEHICLE_STATUSES)[number], string> = {
  active: "Ativo",
  project: "Projeto",
  stored: "Guardado",
  sold: "Vendido",
};

export const vehicleSchema = z.object({
  // Obrigatórios
  make: z.string().trim().min(1, "Informe a marca."),
  model: z.string().trim().min(1, "Informe o modelo."),

  // Opcionais — RN-1 da Fase 011: só marca/modelo definem o veículo numa lista.
  modelYear: z
    .string()
    .optional()
    .transform((val) => (val === undefined || val.trim() === "" ? undefined : Number(val)))
    .refine(
      (val) =>
        val === undefined ||
        (Number.isInteger(val) && val >= 1900 && val <= new Date().getFullYear() + 1),
      "Ano inválido.",
    ),
  currentOdometerKm: optionalNonNegativeInt("a quilometragem atual"),
  fuelType: optionalEnum(FUEL_TYPES),
  transmission: optionalEnum(TRANSMISSIONS),
  purchaseDate: optionalText,
  purchasePrice: optionalNonNegativeNumber("o valor de compra"),

  // "Mais detalhes" — opcionais
  trim: optionalText,
  color: optionalText,
  plate: optionalText,
  engineDescription: optionalText,
  engineDisplacementCc: optionalNonNegativeNumber("a cilindrada"),
  horsepower: optionalNonNegativeNumber("a potência"),
  torqueNm: optionalNonNegativeNumber("o torque"),
  estimatedCurrentValue: optionalNonNegativeNumber("o valor estimado atual"),
  notes: optionalText,
  status: z.enum(VEHICLE_STATUSES).optional(),
});

export type VehicleFormInput = z.input<typeof vehicleSchema>;
export type VehicleFormOutput = z.output<typeof vehicleSchema>;

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const vehiclePhotoSchema = z
  .instanceof(File)
  .refine((file) => ACCEPTED_PHOTO_TYPES.includes(file.type), {
    message: "Envie uma imagem JPEG, PNG ou WebP.",
  })
  .refine((file) => file.size <= MAX_PHOTO_SIZE_BYTES, {
    message: "A imagem precisa ter até 5MB.",
  });
