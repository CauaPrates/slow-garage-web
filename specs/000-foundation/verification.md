# Verificação 000 — Fundação do frontend

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-01 |
| **Resultado** | aprovado, com uma pendência conhecida e aceita (AC-4 parcial) |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | `npm run dev` sobe, `npm run ui:check` sem erro de console em 5 viewports; screenshot `. ui-check/1440-root.png` mostra shell com fundo `#16140F` e header "Slow Garage" |
| AC-2 | ✅ | Script Playwright: `bg antes do toggle: rgb(22, 20, 15)` (`#16140F`) → clique no switch → `bg depois do toggle: rgb(247, 242, 232)` (`#F7F2E8`), `classe light: true` → **reload** → `bg depois do reload: rgb(247, 242, 232)` `classe light: true` `localStorage: light`. Contraste AA: `#F5F1E8` sobre `#16140F` e `#1E1B15` sobre `#F7F2E8` — ambos folgadamente acima de 4.5:1 (checagem manual, não medida por ferramenta) |
| AC-3 | ✅ | `npx tsc -b --noEmit` — saída vazia, sem erro (colado abaixo) |
| AC-4 | ⚠️ parcial | Snippet descartável `supabase.from("vehicles").select("nonexistent_column")` contra o `Database` placeholder produziu `TS2769: Argument of type '"vehicles"' is not assignable to parameter of type 'never'` — comportamento correto verificado. Descartado depois (não fica no repo). **Só cobre o placeholder** — não prova que o tipo real (pós `npm run types`) vai se comportar igual; isso só é verificável quando as credenciais chegarem |
| AC-5 | ✅ | Ver "Casos de formatação" abaixo — todos batem com o formato esperado |
| AC-6 | ⚠️ parcial | Verificado via `npm run build && npm run preview`: manifest servido em `/manifest.webmanifest` com `name`, `icons` (192/512/maskable), `start_url`, `display: standalone`; service worker registra e fica `active: true` (`scope: http://localhost:4173/`); `icon-192.png` responde 200 `image/png`. **Não rodei o Lighthouse literalmente** — o que está acima cobre os critérios centrais do audit de instalabilidade, mas não é o mesmo que o score do Lighthouse. Ver "Para o humano testar na mão" |
| AC-7 | ✅ | `npm run ui:check` em 320/390/768/1440/390-com-teclado-reduzido: `overflow` sempre `scrollWidth <= innerWidth` nos 5 casos (ver `.ui-check/report.json`) |
| AC-8 | ✅ | Sem `.env`: screenshot `.ui-check-noenv-final/390-root.png` mostra "Configuração do Supabase ausente" com instrução clara, zero erro de console, zero violação de axe |
| AC-9 | ✅ | `grep -rnE '#[0-9a-fA-F]{3,8}\b' src` fora de `src/styles/tokens.css` — nenhuma ocorrência |
| AC-10 | ✅ | `grep -rn 'Permanent Marker\|font-hero' src` — só aparece na declaração do token (`tokens.css`, `globals.css`), nenhum componente usa a fonte hero ainda (esperado: nenhum dos 4 pontos combinados existe nesta fase) |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Casos de formatação (AC-5)

Verificados manualmente chamando os helpers de `src/lib/format.ts`:

| Helper | Entrada | Saída |
|---|---|---|
| `formatMoney` | `1234.5` | `"R$ 1.234,50"` |
| `formatDate` | `new Date(2026, 0, 5)` | `"05/01/2026"` |
| `formatKm` | `87400` | `"87.400 km"` |
| `formatConsumption` | `12.4` | `"12,4 km/L"` |
| `formatDecimalInput` | `45.7` | `"45,7"` |
| `parseDecimalInput` | `"45,7"` | `45.7` |
| `parseDecimalInput` | `"abc"` | `null` |

## Saída dos comandos

### Build

```
> slow-garage-web@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 1894 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                                              0.13 kB
dist/index.html                                                 1.64 kB │ gzip:  0.75 kB
dist/assets/space-grotesk-latin-700-normal-RjhwGPKo.woff2      12.84 kB
dist/assets/space-grotesk-latin-600-normal-DjKNqYRj.woff2      13.28 kB
dist/assets/space-grotesk-latin-500-normal-lFbtlQH6.woff2      13.31 kB
dist/assets/space-grotesk-latin-400-normal-CJ-V5oYT.woff2      13.38 kB
dist/assets/space-grotesk-latin-700-normal-CwsQ-cCU.woff       16.41 kB
dist/assets/space-grotesk-latin-600-normal-BflQw4A9.woff       16.88 kB
dist/assets/space-grotesk-latin-500-normal-CNSSEhBt.woff       16.98 kB
dist/assets/space-grotesk-latin-400-normal-BnQMeOim.woff       17.00 kB
dist/assets/permanent-marker-latin-400-normal-BF23djCy.woff2   29.56 kB
dist/assets/permanent-marker-latin-400-normal-BnZj5c41.woff    36.11 kB
dist/assets/index-BFdcxcEz.css                                 13.42 kB │ gzip:  3.56 kB
dist/assets/providers--mBEnnsL.js                               0.08 kB │ gzip:  0.09 kB
dist/assets/jsx-runtime-CznXPbDH.js                             0.43 kB │ gzip:  0.30 kB
dist/assets/rolldown-runtime-CbXtAM7H.js                        0.58 kB │ gzip:  0.36 kB
dist/assets/ConfigMissingScreen-BBIcUdTZ.js                     0.76 kB │ gzip:  0.44 kB
dist/assets/dist-CS8lplfV.js                                    4.20 kB │ gzip:  1.65 kB
dist/assets/preload-helper-DyclX9QJ.js                          4.77 kB │ gzip:  1.93 kB
dist/assets/react-GitiQ0dt.js                                   7.53 kB │ gzip:  2.88 kB
dist/assets/providers-CbYfTbAk.js                              25.21 kB │ gzip:  7.54 kB
dist/assets/router-BdpZjn1C.js                                 42.72 kB │ gzip: 14.62 kB
dist/assets/index-CEFBwfxS.js                                 179.52 kB │ gzip: 56.85 kB
dist/assets/dist-CUsigxWL.js                                  194.86 kB │ gzip: 62.24 kB

✓ built in 308ms

PWA v1.3.0
mode      generateSW
precache  24 entries (545.22 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

### Testes

Não há suíte de testes automatizados nesta fase (não fazia parte do escopo aprovado — ver plan.md). Verificação de comportamento feita via `npm run ui:check` (Playwright + axe-core) e scripts Playwright pontuais descartáveis, cobertos nas seções de AC acima.

### Lint / tipos

```
> slow-garage-web@0.0.0 lint
> eslint .

(sem saída — sem erro nem warning)
```

```
$ npx tsc -b --noEmit
(sem saída — sem erro)
```

### ui:check (resumo)

```
  ok  320         /
  ok  390         /
  ok  768         /
  ok  1440        /
  ok  390-teclado /

Nenhum problema automático.
```
Rodado duas vezes: sem `.env` (screenshots em `.ui-check-noenv-final/`) e com `.env` de smoke test (screenshots em `.ui-check/`). Relatório completo (axe, overflow, console) em `.ui-check/report.json` e `.ui-check-noenv-final/report.json` — ambos com 0 violações de axe, 0 erros de console, 0 overflow, nos 5 viewports.

## Pendências

- **AC-4 parcial**: o placeholder de `Database` prova que a mecânica de erro-de-tipo-em-coluna-inexistente funciona, mas não prova nada sobre o schema real. Só fecha de verdade depois que `SUPABASE_PROJECT_ID` chegar, eu rodar `npm run types`, e repetir a checagem contra tabela real.
- **AC-6 parcial**: instalabilidade verificada por manifest + service worker ativo + ícones servindo, não pelo Lighthouse literal. Ver item 3 em "Para o humano testar na mão".
- **Elemento de marca em katakana** (decisão do clarify de identidade visual): adiado para a fase que construir o primeiro ponto hero real — ver ADR-004 em `docs/DECISIONS.md`. Não é uma pendência desta fase, é decisão explícita de escopo.
- **`.env`**: removido depois dos testes (era só um valor fake para smoke test, nunca foi commitado — `.gitignore` já cobria). Você vai precisar criar o seu com os valores reais do projeto Supabase de desenvolvimento.

## Para o humano testar na mão

1. Copie `.env.example` para `.env`, preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores do projeto Supabase de desenvolvimento, rode `npm run dev` e confirme visualmente o shell (cores, fontes, toggle de tema) — eu vi só via screenshot automatizado, nunca abri num navegador de verdade.
2. Depois de preencher `SUPABASE_PROJECT_ID`, rode `npm run types` e confirme que `src/types/database.types.ts` deixa de ser o placeholder.
3. Se quiser o score oficial do Lighthouse (não só a checagem manual que fiz): `npm run build && npm run preview`, abra `http://localhost:4173` no Chrome, DevTools → Lighthouse → categoria PWA.
4. Instale o PWA de verdade num celular (Android/iOS) — o que verifiquei foi manifest + service worker no desktop, não o fluxo de instalação real em dispositivo.
5. Abra em modo claro do sistema operacional e confirme que o app abre em dark mesmo assim (comportamento esperado, testado só via `localStorage` limpo no Playwright, não com preferência real do SO).
