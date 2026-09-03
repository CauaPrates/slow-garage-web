import { ROUTES } from "@/lib/routes";

type LinkableEvent = {
  event_type: string | null;
  metadata?: unknown;
};

/**
 * Onde "Ver" leva pra cada tipo de evento — a tela de origem, onde o
 * registro pode ser editado de verdade (RN-4: só nota se edita direto
 * na timeline). `project_item` depende de `metadata.project_id`
 * (confirmado presente na view consultando o banco real); sem ele, cai
 * pra lista de projetos em vez de quebrar. Aceita tanto um evento de
 * `vehicle_timeline` (tem `metadata`) quanto um resultado de
 * `search_vehicle` (não tem — `metadata` fica `undefined`).
 */
export function resolveTimelineLink(vehicleId: string, event: LinkableEvent): string | null {
  switch (event.event_type) {
    case "expense":
      return ROUTES.vehicleExpenses(vehicleId);
    case "fuel_log":
      return ROUTES.vehicleFuelLogs(vehicleId);
    case "maintenance_record":
      return ROUTES.vehicleMaintenance(vehicleId);
    case "issue":
      return ROUTES.vehicleIssues(vehicleId);
    case "project_item": {
      const metadata = event.metadata;
      const projectId =
        metadata && typeof metadata === "object" && !Array.isArray(metadata)
          ? (metadata as Record<string, unknown>).project_id
          : undefined;
      return typeof projectId === "string"
        ? ROUTES.vehicleProject(vehicleId, projectId)
        : ROUTES.vehicleProjects(vehicleId);
    }
    case "document":
      return ROUTES.vehicleDocuments(vehicleId);
    case "note":
      return null;
    default:
      return null;
  }
}
