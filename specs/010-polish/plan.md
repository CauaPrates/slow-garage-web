# Plano 010 — Polimento, acessibilidade, performance e deploy

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado (autonomia total já concedida pelo usuário para todas as fases) |

## 1. Abordagem

Diferente das fases anteriores, não há feature nova — é auditoria seguida de correção pontual. Ordem: (1) varredura automatizada (script Playwright cobrindo toda rota principal, 4 breakpoints, axe-core, overflow), (2) correção do que a varredura encontrar, (3) medição de performance/PWA via Lighthouse contra o build de produção servido localmente, (4) ajuste de performance se a medição justificar, (5) preparação de deploy (`vercel.json`, `README.md`).

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Rodar Lighthouse contra o dev server (`vite dev`) | Dev server não é minificado nem tem o mesmo comportamento de cache/SW do build real — número não significa nada. Sempre contra `vite preview` do build de produção |
| Corrigir o WARN de contraste da paleta categórica trocando as cores | A paleta já foi validada pela skill `dataviz` e o WARN já tem mitigação documentada (rótulo direto sempre visível — ADR-039); trocar cor sem motivo novo contradiz uma decisão já tomada com critério |
| Testes automatizados (unit/integration) como parte do polimento | Fora do método deste projeto desde a Fase 0 — verificação sempre foi Playwright real contra Supabase de dev; introduzir um framework de teste novo nesta fase seria escopo não pedido |
| Migrar `react-router-dom` de modo biblioteca pra modo framework (file-based routing) só pra ganhar code-splitting automático | Mudança de arquitetura de roteamento não é "polimento" — é reescrita. Code-splitting manual por rota (`React.lazy`) entrega o mesmo ganho sem mexer no que já funciona (ADR-006) |

## 3. Impacto em contratos e dados

Nenhum — zero mudança de schema, RPC ou view. Todo trabalho é frontend-only (correção visual/estrutural, config de build, config de deploy).

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `scripts/audit-all-routes.mjs` | criar (descartável, apagado ao final) | Varre toda rota principal × 4 breakpoints, axe-core, overflow, screenshot |
| *(telas com problema encontrado)* | modificar | Corrigido caso a caso — lista exata só depois da varredura rodar |
| `src/app/router.tsx` | modificar | `React.lazy` + `Suspense` por rota, se a medição de performance justificar |
| `vercel.json` | criar | Rewrite de SPA (`/(.*) → /index.html`) |
| `README.md` | modificar | Estrutura de pastas, scripts e roadmap reais (hoje descreve um plano inicial em inglês que não bate com o que foi construído); instruções de deploy |
| `docs/DECISIONS.md` | modificar | ADR(s) das correções não-óbvias encontradas na varredura |
| `docs/DESIGN.md` | modificar | Só se a varredura revelar um padrão de densidade não documentado ainda |

## 5. Ordem de execução

1. `scripts/audit-all-routes.mjs` — roda contra o Supabase de dev real, autenticado, com um veículo de teste com dado em toda entidade (reaproveita o padrão de veículo temporário de toda fase anterior)
2. Corrigir cada achado (empty/loading/error faltando, overflow, violação de acessibilidade), tela por tela
3. Rerodar a varredura até zero achado
4. `npm run build && npm run preview` — Lighthouse Performance + PWA contra o preview
5. Se Performance apontar JS inicial grande: `React.lazy` por rota, remedir
6. `vercel.json` + `README.md`
7. `docs/DECISIONS.md`/`docs/DESIGN.md`, `verification.md`
8. Commit, merge

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1, AC-2 | Saída literal do script de varredura (overflow + axe) por rota × breakpoint | automático |
| AC-3 | Script força cada estado (rota inexistente pra erro, veículo novo pra vazio, throttle de rede pra loading) e confere texto | automático |
| AC-4, AC-5 | Saída literal do relatório Lighthouse (`lighthouse` CLI, `--output json`, pontuação extraída) | automático |
| AC-6 | Leitura do `README.md` final, conferida linha a linha contra o repositório real | manual (revisão própria) |
| AC-7 | `vercel.json` presente e validado localmente simulando o rewrite (`vite preview` já faz fallback de SPA por padrão — conferir que o comportamento bate) | automático + manual |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Corrigir uma tela nesta fase sem entender por que ela foi feita assim numa fase anterior | Desfazer uma decisão proposital documentada | Consultar `docs/DECISIONS.md`/`docs/DESIGN.md` antes de qualquer mudança em tela já existente |
| `React.lazy` por rota introduzir um flash de loading perceptível em navegação rápida | Regressão de UX pra ganho de performance que talvez nem seja needed | Só aplicado se a medição real mostrar ganho que justifique; `Suspense` com fallback mínimo (mesmo skeleton já usado nas próprias páginas) |
| Lighthouse local não bater com produção real (rede/CPU) | Número documentado pode não se sustentar pós-deploy | Reportado como "medição local", não como garantia — instrução pro humano remedir depois do deploy real |

## 8. Rollback

Sem migration, sem dado tocado — reverter é `git revert`/descartar a branch. `vercel.json` e mudanças de `README.md` não têm efeito nenhum até o humano de fato conectar o repositório na Vercel.

## 9. Definição de pronto

- [ ] Todos os ACs (AC-1 a AC-7) verificados com evidência em `verification.md`
- [ ] `npm run build` passa
- [ ] `tsc -b` sem erro
- [ ] `eslint` sem erro
- [ ] Zero violação `serious`/`critical` de axe-core em qualquer rota principal
- [ ] Zero overflow horizontal em qualquer rota × breakpoint
- [ ] Relatório Lighthouse (Performance + PWA) com número real, não estimado
- [ ] `vercel.json`/`README.md` prontos pro humano fazer o deploy
- [ ] `docs/DECISIONS.md`/`docs/DESIGN.md` atualizados
- [ ] `feature/010-polish` mergeada em `dev` (`--no-ff`), branch preservada
