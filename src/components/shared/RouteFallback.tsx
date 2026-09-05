/**
 * Fallback do `Suspense` de cada rota com `React.lazy` (Fase 10) — só
 * aparece durante o download/parse do chunk da página (rápido, e cacheado
 * pelo service worker depois da primeira visita). Cada página já tem seu
 * próprio esqueleto para o carregamento de dado; este é só a ponte até o
 * componente da página existir.
 */
export function RouteFallback() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
      <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}
