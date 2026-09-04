# Verificação 010 — Polimento, acessibilidade, performance e deploy

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |
| **Data** | 2026-09-04 |

## Método

Diferente das fases anteriores, sem veículo temporário criado/apagado — a
varredura roda contra o veículo seed (`bob`/Chevrolet Opala, que já tem
dado real em toda entidade) e uma rota de veículo inexistente pra exercitar
o caminho de erro. Script `scripts/audit-all-routes.mjs` (apagado ao final
desta fase — descartável, como todo script de verificação do projeto),
autenticado, visita 18 rotas × 4 breakpoints (320/390/768/1440px) = 72
combinações, checando overflow horizontal, axe-core (`wcag2a`/`wcag2aa`/
`wcag21a`/`wcag21aa`) e erro de console, com screenshot de cada uma.

Performance e PWA medidos contra `npm run build && npm run preview`
(servidor de produção local), nunca contra o dev server.

## AC-1 / AC-2 — Varredura de overflow e acessibilidade

**Primeira rodada** (antes de qualquer correção) — 28 de 72 combinações
com achado, todos o mesmo tipo de problema (`color-contrast`, `serious`,
axe-core), em 7 rotas distintas × 4 breakpoints:

```
[320] dashboard — axe [serious] color-contrast (6x) — <p class="font-medium">Revisão de freios</p> / <p class="text-xs opacity-90">Venceu em ...
[320] manutencao — axe [serious] color-contrast (7x) — mesmo padrão
[320] problemas — axe [serious] color-contrast (1x) — <span class="... border-warning/40 bg-warning/10 text-warning">Aberto</span>
[320] documentos-* (4 abas) — axe [serious] color-contrast (4-5x cada) — mesmo padrão do AlertBanner
```

(Idêntico nos 4 breakpoints — é contraste de cor, não layout, então não
varia por largura de tela.)

**Causa raiz calculada** (não estimada — ver `docs/DECISIONS.md` ADR-043):
`text-warning`/`text-error` sobre o próprio fundo `bg-X/10` caía abaixo de
4.5:1 nos dois temas (dark: 4.07/3.29 real; light: 4.30 no warning). Corrigido
ajustando `--color-error`/`--color-warning` (dark) e `--color-warning`/
`--color-success` (light) em `tokens.css`, e removendo `opacity-90` da
legenda de data do `AlertBanner` (reduzia contraste ainda mais, sem função).

**Segunda rodada** (depois da correção):

```
72/72 rota×viewport sem achado.
Nenhum achado.
```

Rodada de novo uma terceira vez depois do code-splitting da rota (ADR-044),
pra garantir que o `Suspense`/lazy loading não introduziu nenhuma regressão
de layout ou acessibilidade — mesmo resultado: **72/72 sem achado**.

## AC-3 — Empty/loading/error

- **Erro** (rota `veiculo-inexistente`): testada nas 4 combinações de
  breakpoint na varredura acima — sem erro de console, sem overflow, sem
  violação. `VehiclePage` mostra "Veículo não encontrado." + link de volta.
- **Vazio**: já coberto tela por tela em cada `specs/00N-*/verification.md`
  anterior (AC específico de cada fase). Revisado nesta fase: `VehiclePage`
  não tem texto de "vazio" próprio porque delega pros blocos filhos
  (`FinancialSummaryCard`, `FuelSummarySection`, gráficos), que já mostram
  "—"/"Nenhum gasto registrado ainda." — confirmado lendo o componente, não
  só grep, depois de um achado de reconhecimento ter sinalizado isso como
  candidato a lacuna (era falso positivo).
- **Carregando**: todo `*Page.tsx` com `isLoading` já tinha esqueleto
  (`animate-pulse`) desde a própria fase que o criou — confirmado por
  inspeção cruzada com `docs/DESIGN.md` (seção "Densidade").

## AC-4 — Performance (Lighthouse contra o build de produção)

**Desktop preset** (sem throttling) — `http://localhost:4173/` (tela de
login):

```
performance = 100
accessibility = 100
best-practices = 100
seo = 82
largest-contentful-paint = 0.7 s
first-contentful-paint = 0.5 s
total-blocking-time = 0 ms
cumulative-layout-shift = 0
speed-index = 0.5 s
```

**Mobile, throttling padrão do Lighthouse (4G lento + CPU 4x mais lenta)**
— antes do code-splitting de rota:

```
performance = 88
largest-contentful-paint = 3.5 s
total-blocking-time = 60 ms
unused-javascript = Est savings of 198 KiB
```

Depois do code-splitting (`React.lazy` por rota, ADR-044):

```
performance = 88
largest-contentful-paint = 3.5 s
total-blocking-time = 0 ms
unused-javascript = Est savings of 95 KiB
```

`unused-javascript` caiu de 198KiB pra 95KiB e `total-blocking-time` zerou,
mas o `performance` score e o LCP não mudaram — investigado e documentado
em ADR-045: o gargalo restante em rede throttled é a cadeia sequencial
`AuthProvider` → `getSession()` → `GuestRoute` → chunk da página de login,
não o tamanho do bundle (que já foi endereçado). Registrado como
limitação conhecida, não escondida — corrigi-la exigiria trocar o
comportamento de UX (mostrar o formulário antes de saber se o usuário já
está logado) ou SSR, nenhum dos dois cabe no escopo de "polimento".

Navegação client-side (depois do carregamento inicial) confirmada
instantânea — medido com `PerformanceNavigationTiming` real, autenticado,
nas duas rotas mais pesadas do app:

```
/v/<opala>            {"domContentLoaded":19,"firstContentfulPaint":40}
/v/<opala>/historico  {"domContentLoaded":14,"firstContentfulPaint":32}
```

(Milissegundos — é troca de rota numa SPA já carregada, não um novo
carregamento de página.)

## AC-5 — PWA instalável

Lighthouse 12.8.2 **removeu a categoria PWA** do core (confirmado:
`Object.keys(r.categories)` não inclui `"pwa"`, nenhum audit relacionado a
manifest/service-worker/installable no relatório). Substituído pela mesma
API que a categoria usava por baixo, acessada direto via Chrome DevTools
Protocol (`Page.getInstallabilityErrors`) contra o build de produção:

```
installabilityErrors: []
service worker: [{"scope":"http://localhost:4173/","active":true}]
```

Lista vazia de erros = instalável pelos critérios nativos do Chrome (manifest
válido, ícones corretos — 192/512/512 maskable —, service worker ativo,
`display: standalone`, servido via HTTPS em produção). Isso substitui a
verificação parcial da Fase 0 (que só inspecionava o manifest manualmente,
sem rodar a checagem real do navegador).

## AC-6 — `README.md`

Reescrito por completo — a versão anterior descrevia um plano inicial em
inglês (estrutura `routes/`, scripts `typecheck`/`format` que nunca
existiram, roadmap de 10 fases com nomes diferentes do que foi construído).
Nova versão bate com o repositório real: estrutura `features/` real,
scripts reais (`dev`/`build`/`preview`/`lint`/`types`/`icons`/`ui:check`),
tabela de fases com os nomes/pastas reais de `specs/`, passo a passo de
deploy batendo com `vercel.json`.

## AC-7 — Rewrite de SPA (`vercel.json`)

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Comportamento equivalente confirmado localmente — `vite preview` já faz o
mesmo fallback de SPA nativamente:

```
$ curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4173/v/<opala>/historico"
200
```

O deploy real na Vercel (onde esse rewrite passa a ser necessário, já que
lá não há o fallback automático do `vite preview`) fica para o usuário —
decisão explícita (ver spec.md §3, "Principal — deploy").

## Build, tipo e lint

```
$ npx tsc -b
(sem saída — sem erro)

$ npx eslint src
(sem saída — sem erro)

$ npm run build
✓ 3061 modules transformed.
✓ built in 3.69s
PWA v1.3.0 — precache 74 entries (1166.61 KiB)
```

## Regressão

`React.lazy` por rota (ADR-044) reverificado com a varredura completa de
72 rota×viewport — 0 achado, igual a antes da mudança. Todas as 10 fases
anteriores continuam navegáveis e sem erro de console.

## Fora de escopo (por decisão explícita)

- O deploy em si na Vercel — ação do usuário (decisão tomada antes desta
  spec: "eu preparo tudo, você clica Deploy").
- Instalação em dispositivo físico real — ação do usuário; instrução:
  abrir a URL de produção no Chrome Android ou Safari iOS e usar
  "Adicionar à tela inicial"/"Instalar app", confirmar que abre em modo
  standalone (sem barra de endereço).
- LCP de ~3.5s em rede móvel throttled — limitação conhecida e documentada
  (ADR-045), não uma correção pendente esquecida.

## G4 — Gate de verificação

7/7 ACs verificados com evidência literal, build/tipo/lint limpos, um bug
de acessibilidade real encontrado e corrigido na raiz (token de cor, não
patch por componente), performance medida duas vezes (antes/depois de uma
melhoria real aplicada), PWA confirmado instalável pela API nativa do
Chrome. Pronto para merge — e, depois do deploy manual do usuário, pronto
para uso real.
