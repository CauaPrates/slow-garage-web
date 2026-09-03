/**
 * Traduz erro do Postgres/PostgREST para mensagem em português — nunca
 * deixa `duplicate key value violates unique constraint "..."` chegar
 * cru na tela. Ver skill `slow-garage-data` para a tabela de códigos.
 */
export function translatePostgresError(error: unknown): string {
  const code = hasCode(error) ? error.code : undefined;

  switch (code) {
    case "23505":
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
