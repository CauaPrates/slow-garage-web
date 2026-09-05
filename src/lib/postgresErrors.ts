/**
 * Traduz erro do Postgres/PostgREST para mensagem em português — nunca
 * deixa `duplicate key value violates unique constraint "..."` chegar
 * cru na tela. Ver skill `slow-garage-data` para a tabela de códigos.
 */
export function translatePostgresError(error: unknown): string {
  const code = hasCode(error) ? error.code : undefined;
  const message = hasMessage(error) ? error.message : "";

  switch (code) {
    case "23505":
      // fuel_logs tem constraint única em (vehicle_id, odometer_km) — mensagem
      // específica em vez do genérico "já existe um registro com esses dados"
      // (ver docs/API_CONTRACT.md, seção `fuel_logs`).
      if (message.includes("fuel_logs") && message.includes("odometer_km")) {
        return "Esse odômetro já foi registrado para este veículo.";
      }
      return "Já existe um registro com esses dados.";
    case "23503":
      return "O item vinculado não existe mais.";
    case "23514":
      return "Valor inválido para este campo.";
    case "42501":
      return "Você não tem acesso a este registro.";
    case "PGRST116":
      return "Registro não encontrado.";
    default:
      return "Não foi possível concluir a operação. Tente de novo.";
  }
}

function hasCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}
