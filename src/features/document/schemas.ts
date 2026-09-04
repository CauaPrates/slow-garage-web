import { z } from "zod";
import { optionalEnum, optionalNonNegativeNumber, optionalText } from "@/lib/schemaHelpers";

export const DOCUMENT_TYPES = [
  "invoice",
  "receipt",
  "quote",
  "report",
  "insurance",
  "registration",
  "other",
] as const;

export const DOCUMENT_TYPE_LABELS: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  invoice: "Nota fiscal",
  receipt: "Recibo",
  quote: "Orçamento",
  report: "Laudo",
  insurance: "Seguro",
  registration: "Registro (CRLV etc.)",
  other: "Outro",
};

export const OBLIGATION_KINDS = ["insurance", "ipva", "licensing", "inspection", "other"] as const;

export const OBLIGATION_KIND_LABELS: Record<(typeof OBLIGATION_KINDS)[number], string> = {
  insurance: "Seguro",
  ipva: "IPVA",
  licensing: "Licenciamento",
  inspection: "Vistoria",
  other: "Outro",
};

export const VEHICLE_PHOTO_CATEGORIES = [
  "exterior",
  "interior",
  "engine",
  "wheels",
  "mods",
  "before_after",
  "other",
] as const;

export const VEHICLE_PHOTO_CATEGORY_LABELS: Record<
  (typeof VEHICLE_PHOTO_CATEGORIES)[number],
  string
> = {
  exterior: "Exterior",
  interior: "Interior",
  engine: "Motor",
  wheels: "Rodas",
  mods: "Modificações",
  before_after: "Antes/depois",
  other: "Outro",
};

export const documentSchema = z.object({
  docType: optionalEnum(DOCUMENT_TYPES),
  title: z.string().trim().min(1, "Informe o título."),
  expiresOn: optionalText,
  issuedOn: optionalText,
  amount: optionalNonNegativeNumber("o valor"),
  notes: optionalText,
});

export type DocumentFormInput = z.input<typeof documentSchema>;
export type DocumentFormOutput = z.output<typeof documentSchema>;

export const obligationSchema = z.object({
  kind: optionalEnum(OBLIGATION_KINDS),
  label: z.string().trim().min(1, "Informe o rótulo."),
  dueOn: optionalText,
  amount: optionalNonNegativeNumber("o valor"),
  provider: optionalText,
  notes: optionalText,
  /** Só editável no formulário de editar — ver §8 da spec: limpar esse campo é como "desfazer pagamento". */
  paidOn: optionalText,
});

export type ObligationFormInput = z.input<typeof obligationSchema>;
export type ObligationFormOutput = z.output<typeof obligationSchema>;

export const financingSchema = z
  .object({
    financedAmount: optionalNonNegativeNumber("o valor financiado"),
    installmentAmount: optionalNonNegativeNumber("o valor da parcela"),
    installmentCount: z
      .string()
      .optional()
      .transform((val) => (val === undefined || val.trim() === "" ? undefined : Number(val)))
      .refine(
        (val) => val === undefined || (Number.isInteger(val) && val > 0),
        "Quantidade de parcelas inválida.",
      ),
    installmentsPaid: z
      .string()
      .optional()
      .transform((val) => (val === undefined || val.trim() === "" ? 0 : Number(val)))
      .refine((val) => Number.isInteger(val) && val >= 0, "Parcelas pagas inválido."),
    startedOn: optionalText,
    interestRateMonthly: optionalNonNegativeNumber("a taxa de juros"),
  })
  .refine(
    (data) => data.installmentCount === undefined || data.installmentsPaid <= data.installmentCount,
    {
      message: "Parcelas pagas não pode passar da quantidade total de parcelas.",
      path: ["installmentsPaid"],
    },
  );

export type FinancingFormInput = z.input<typeof financingSchema>;
export type FinancingFormOutput = z.output<typeof financingSchema>;

export const photoUploadSchema = z.object({
  category: optionalEnum(VEHICLE_PHOTO_CATEGORIES),
  caption: optionalText,
});

export type PhotoUploadFormInput = z.input<typeof photoUploadSchema>;
export type PhotoUploadFormOutput = z.output<typeof photoUploadSchema>;
