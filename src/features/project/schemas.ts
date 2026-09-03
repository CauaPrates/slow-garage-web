import { z } from "zod";
import {
  optionalNonNegativeNumber,
  optionalText,
} from "@/lib/schemaHelpers";
import { PRIORITY_LEVELS } from "@/features/maintenance/schemas";

export const PROJECT_STATUSES = [
  "idea",
  "planned",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
] as const;

export const PROJECT_STATUS_LABELS: Record<(typeof PROJECT_STATUSES)[number], string> = {
  idea: "Ideia",
  planned: "Planejado",
  in_progress: "Em andamento",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const PROJECT_ITEM_STATUSES = [
  "wishlist",
  "planned",
  "purchased",
  "installed",
  "cancelled",
] as const;

export const PROJECT_ITEM_STATUS_LABELS: Record<(typeof PROJECT_ITEM_STATUSES)[number], string> = {
  wishlist: "Lista de desejos",
  planned: "Planejado",
  purchased: "Comprado",
  installed: "Instalado",
  cancelled: "Cancelado",
};

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  status: z.enum(PROJECT_STATUSES),
  budget: optionalNonNegativeNumber("o orçamento"),
  description: optionalText,
  notes: optionalText,
  startedOn: optionalText,
  targetDate: optionalText,
  completedOn: optionalText,
});

export type ProjectFormInput = z.input<typeof projectSchema>;
export type ProjectFormOutput = z.output<typeof projectSchema>;

/** RN-3: todo item pertence a um projeto — `projectId` é sempre exigido, mesmo quando a tela de detalhe já sabe qual é (ver `ProjectItemForm`). */
export const projectItemSchema = z.object({
  projectId: z.string().min(1, "Selecione o projeto."),
  name: z.string().trim().min(1, "Informe o nome."),
  status: z.enum(PROJECT_ITEM_STATUSES),
  priority: z.enum(PRIORITY_LEVELS),
  vendor: optionalText,
  externalUrl: optionalText,
  estimatedCost: optionalNonNegativeNumber("o custo estimado"),
  actualCost: optionalNonNegativeNumber("o custo real"),
  occurredOn: optionalText,
  description: optionalText,
  notes: optionalText,
});

export type ProjectItemFormInput = z.input<typeof projectItemSchema>;
export type ProjectItemFormOutput = z.output<typeof projectItemSchema>;
