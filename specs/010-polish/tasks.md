# Tasks 010 — Polimento, acessibilidade, performance e deploy

Referência: ./plan.md §5.

- [x] T1 — `scripts/audit-all-routes.mjs`: varre toda rota principal × 320/390/768/1440px com axe-core + overflow, veículo de teste com dado em toda entidade — AC-1, AC-2
- [x] T2 — Rodar T1, listar achados reais (overflow, violação, estado faltando)
- [x] T3 — Corrigir cada achado tela por tela — AC-1, AC-2, AC-3
- [x] T4 — Rerodar T1 até zero achado
- [x] T5 — `npm run build && npm run preview` + Lighthouse Performance — AC-4
- [x] T6 — Lighthouse PWA (categoria removida do Lighthouse 10+; substituída por `Page.getInstallabilityErrors` via CDP, a mesma API que a categoria usava por baixo) — AC-5
- [x] T7 — `React.lazy` por rota em `router.tsx` (medição justificou: 198KiB de JS sem uso na tela de login) — AC-4
- [x] T8 — `vercel.json` (rewrite de SPA) — AC-7
- [x] T9 — Atualizar `README.md` (estrutura, scripts, roadmap, deploy reais) — AC-6
- [x] T10 — `docs/DECISIONS.md`/`docs/DESIGN.md` (correções não-óbvias)
- [x] T11 — `specs/010-polish/verification.md`
- [x] T12 — `tsc -b` + lint + build limpos
- [x] T13 — Commit + merge `--no-ff` em `dev`
