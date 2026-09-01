/**
 * Objeto de rotas tipado — nenhuma string de rota deve aparecer solta
 * em componente. Fases seguintes estendem este objeto conforme criam
 * telas de domínio (ex: `vehicle: (id: string) => \`/v/${id}\``).
 */
export const ROUTES = {
  home: "/",
} as const;
