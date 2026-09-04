import { z } from "zod";
import {
  optionalNonNegativeInt,
  optionalNonNegativeNumber,
  optionalText,
} from "@/lib/schemaHelpers";
import { PRIORITY_LEVELS } from "@/features/maintenance/schemas";

export const ISSUE_STATUSES = [
  "open",
  "investigating",
  "waiting_part",
  "in_repair",
  "resolved",
  "dismissed",
] as const;

export const ISSUE_STATUS_LABELS: Record<(typeof ISSUE_STATUSES)[number], string> = {
  open: "Aberto",
  investigating: "Investigando",
  waiting_part: "Aguardando peça",
  in_repair: "Em reparo",
  resolved: "Resolvido",
  dismissed: "Descartado",
};

/** RN-2: status é campo livre — qualquer transição é permitida, sem máquina de estado. */
export const OPEN_ISSUE_STATUSES: readonly string[] = [
  "open",
  "investigating",
  "waiting_part",
  "in_repair",
];

export const issueSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  reportedOn: optionalText,
  priority: z.enum(PRIORITY_LEVELS),
  status: z.enum(ISSUE_STATUSES),
  description: optionalText,
  diagnosis: optionalText,
  resolution: optionalText,
  resolvedOn: optionalText,
  odometerKm: optionalNonNegativeInt("a quilometragem"),
  cost: optionalNonNegativeNumber("o custo"),
});

export type IssueFormInput = z.input<typeof issueSchema>;
export type IssueFormOutput = z.output<typeof issueSchema>;
