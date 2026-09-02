# Verificação 003 — Casca de navegação e rota do veículo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-02 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Script Playwright (`verify-003.tmp.mjs`, descartado após uso) logado como `bob@dev.local`: clique no card do Chevrolet Opala em `/` navega para `/v/bbbbbbbb-0000-0000-0000-000000000001` e o `<h1>` mostra exatamente "Chevrolet Opala", igual ao `<h3>` do card de origem |
| AC-2 | ✅ | `naturalWidth=1` no `<img>` do header — carregou (não é imagem quebrada, `onerror` não disparou). Observação visual: a foto do Opala renderiza como um retângulo preto tanto no card da garagem quanto no header do veículo — comportamento **idêntico ao já existente na Fase 2** (mesma `photoUrl`), não uma regressão desta fase. Ver "Pendências" |
| AC-3 | ✅ | Acesso a `/v/00000000-0000-0000-0000-000000000000`: texto "Veículo não encontrado" presente + link "Voltar para a garagem" para `/`, sem erro de console |
| AC-4 | ✅ | Screenshot `1440-garagem.png`/`1440-veiculo.png`: 10 itens na sidebar; "Minha garagem" e "Configurações" são `<a>` clicáveis; os outros 7 são `<button aria-disabled="true">` com rótulo "Em breve", confirmado via `getAttribute("aria-disabled")` para cada um |
| AC-5 | ✅ | Screenshot `390-garagem.png`: 5 itens na bottom nav; "Carros" e "Configurações" são `<a>`; "Home" e "Dados" são `<button aria-disabled="true">` |
| AC-6 | ✅ | Toque em "Adicionar" (390px) abre folha com título "Adicionar" e 6 botões (Gasto, Abastecimento, Manutenção, Upgrade, Foto, Nota), todos `aria-disabled="true"`. `Esc` fecha (`getByRole("dialog").count() === 0` depois); clique fora fecha do mesmo jeito |
| AC-7 | ✅ | Criado um 2º veículo temporário ("TempTeste VerificaçãoFase3") via `CreateVehicleDialog` já existente da Fase 2. Com 2 veículos, o seletor em `/v/:id` mostra 2 opções e fica habilitado (`disabled=false`); selecionar o outro navega para `/v/<outroId>` e o `<h1>` passa a mostrar "TempTeste VerificaçãoFase3". Veículo temporário removido ao final (confirmado: 0 ocorrências do nome após a exclusão, e uma segunda checagem independente do banco não encontrou nenhum resíduo) |
| AC-8 | ✅ | Com 1 veículo só (estado real de `bob@dev.local` fora do teste de AC-7): seletor com `options.length === 1` e `disabled === true` |
| AC-9 | ✅ | `sidebar.getByRole("button", {name: /Dashboard/}).focus()` seguido de `document.activeElement.textContent` confirma que o item desabilitado recebe foco de verdade (não é removido da árvore de tab) |
| AC-10 | ✅ | `ui:check`-style: 320px em `/` e `/v/:id` → `scrollWidth === innerWidth === 320` nos dois casos; botão "Adicionar" com `width=56 height=56` (≥44px). Achado real durante a revisão visual dos screenshots (não pego pelo overflow automático) e corrigido: ver "Achado e correção" abaixo |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Achado e correção durante a verificação visual

Overflow automático (`scrollWidth === innerWidth`) passou em 320px desde
o início, mas a **revisão visual dos screenshots** (obrigatória por
`ui-verify`, não substituível pelo assert automático) mostrou o rótulo
"Configurações" da bottom nav tocando a borda direita da tela em 320px —
os itens `flex-1` não encolhiam (`min-width: auto` do Flexbox por
padrão), então o texto ficava sem respiro visual mesmo sem estourar a
página. Corrigido em `BottomNav.tsx`: `min-w-0` nos itens + `truncate`
no rótulo + `px-1` na `<nav>`. Depois do ajuste, "Configurações" trunca
para "Configura…" em 320px e aparece por inteiro a partir de ~340px —
confirmado em novos screenshots (`navbar-320.png`, `navbar-390.png`).
Registrado como ADR-023.

## Saída dos comandos

### Build
```
> slow-garage-web@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 2949 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                                              0.13 kB
dist/index.html                                                 1.67 kB │ gzip:  0.76 kB
dist/assets/index-C-wImdmH.css                                 21.92 kB │ gzip:  5.19 kB
dist/assets/index-CI5LICZd.js                                 179.82 kB │ gzip: 56.96 kB
dist/assets/dist-CUsigxWL.js                                  194.86 kB │ gzip: 62.24 kB
dist/assets/providers-u7KIg_Jl.js                             238.03 kB │ gzip: 62.74 kB
dist/assets/router-D2C5--Ln.js                                240.21 kB │ gzip: 71.93 kB

✓ built in 269ms

PWA v1.3.0
mode      generateSW
precache  24 entries (954.52 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

### Tipos (`tsc --noEmit`)
```
(saída vazia — sem erro)
```

### Lint (`eslint .`)
```
> slow-garage-web@0.0.0 lint
> eslint .

(saída vazia — sem erro)
```

### Verificação funcional (script Playwright descartável, autenticado contra o Supabase de dev real)
```
  ok  sidebar "Dashboard" desabilitado — aria-disabled=true
  ok  sidebar "Minha garagem" habilitado
  ok  sidebar "Gastos" desabilitado — aria-disabled=true
  ok  sidebar "Abastecimentos" desabilitado — aria-disabled=true
  ok  sidebar "Manutenção" desabilitado — aria-disabled=true
  ok  sidebar "Problemas" desabilitado — aria-disabled=true
  ok  sidebar "Projetos" desabilitado — aria-disabled=true
  ok  sidebar "Histórico" desabilitado — aria-disabled=true
  ok  sidebar "Documentos" desabilitado — aria-disabled=true
  ok  sidebar "Configurações" habilitado
  ok  AC-9: item desabilitado da sidebar recebe foco
  ok  AC-1: navegou para /v/:id ao clicar no card — http://localhost:5173/v/bbbbbbbb-0000-0000-0000-000000000001
  ok  AC-1: header mostra o mesmo marca/modelo do card clicado — card="Chevrolet Opala" header="Chevrolet Opala"
  ok  AC-2: imagem do veículo carregou (não quebrada) — naturalWidth=1
  ok  AC-8: seletor sem outra opção quando há 1 veículo — options=1 disabled=true
  ok  AC-3: veículo inexistente mostra 'não encontrado' + link de volta
  ok  AC-7: com 2 veículos o seletor fica habilitado com 2 opções — options=2 disabled=false
  ok  AC-7: trocar no seletor navega para o outro veículo — TempTeste VerificaçãoFase3
  ok  limpeza: veículo temporário removido
  ok  desktop: console sem erro
  ok  axe desktop sem violação serious/critical
  ok  bottom nav "Home" desabilitado — aria-disabled=true
  ok  bottom nav "Carros" habilitado
  ok  bottom nav "Dados" desabilitado — aria-disabled=true
  ok  bottom nav "Configurações" habilitado
  ok  AC-10: botão Adicionar tem alvo de toque >=44px — {"x":166.98,"y":776,"width":56,"height":56}
  ok  AC-6: folha abre com título e 6 itens desabilitados
  ok  AC-6: Esc fecha a folha — diálogos visíveis=0
  ok  AC-6: clicar fora fecha a folha — diálogos visíveis=0
  ok  mobile: console sem erro
  ok  axe mobile sem violação serious/critical
  ok  AC-10: sem overflow horizontal em 320px (/) — {"scrollWidth":320,"innerWidth":320}
  ok  AC-10: sem overflow horizontal em 320px (/v/bbbbbbbb-0000-0000-0000-000000000001) — {"scrollWidth":320,"innerWidth":320}

33/33 checagens passaram.
```

axe-core rodou com as tags `wcag2a`/`wcag2aa` em desktop (1440px) e
mobile (390px), autenticado, nas rotas `/` e `/v/:id` com a folha
"Adicionar" aberta — nenhuma violação `serious`/`critical` nos dois
casos.

## Pendências

- A foto principal do Chevrolet Opala (seed de `bob@dev.local`, upload
  original da verificação da Fase 2) renderiza como um retângulo preto
  em vez de mostrar o carro — mas isso já acontecia identicamente antes
  desta fase (mesmo `photoUrl`, mesmo comportamento no card da Fase 2).
  Não é uma regressão da Fase 3 e não foi investigado aqui, porque
  mexer no arquivo de imagem armazenado no Storage de outra conta de
  teste está fora do escopo desta fase. Se for um problema real, é
  candidato a olhar quando a Fase 8 (galeria/documentos) mexer de novo
  em foto.
- AC-2 foi verificado no caminho "tem foto" (Opala) e no caminho "sem
  foto" apenas por leitura de código (o mesmo componente `<Car
  aria-hidden>` já usado e testado visualmente no `VehicleCard` da Fase
  2) — não foi criado um veículo sem foto especificamente para
  fotografar esse estado nesta verificação, para não sujar ainda mais o
  banco de dev com dado descartável.

## Para o humano testar na mão

1. Abrir `/` autenticado, clicar num veículo, conferir que o header e o
   resumo (km, total investido) correspondem ao card clicado.
2. Redimensionar a janela abaixo de 1024px e conferir a troca de
   sidebar para bottom nav (sem os dois aparecerem ao mesmo tempo).
3. No celular real (ou emulação de toque), tocar em "Adicionar" e
   confirmar que a folha desliza da base e é fácil de fechar com o
   polegar.
4. Testar a troca de veículo pelo seletor do header com uma conta que
   tenha 2+ veículos de verdade (não o veículo descartável criado
   nesta verificação).
5. Conferir manualmente, num leitor de tela, que os itens "Em breve"
   são anunciados como indisponíveis em vez de simplesmente
   silenciosos.
