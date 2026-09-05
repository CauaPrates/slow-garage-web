# Verificação 004 — Gastos do veículo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-03 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Veículo temporário recém-criado, `/v/:id/gastos`: texto "Nenhum gasto registrado ainda." + botão "Registrar primeiro gasto" |
| AC-2 | ✅ | Gasto criado (categoria/valor/descrição/data) aparece no topo da lista; header do veículo passa a mostrar "Total investido: R$ 50.150,50" (antes "—") |
| AC-3 | ✅ | Submissão com os 4 campos vazios: diálogo permanece aberto, 3 mensagens de erro visíveis ("Selecione a categoria."/"Informe...") |
| AC-4 | ✅ | Valor `-50`: mensagem "Valor inválido." exibida, diálogo permanece aberto, nenhuma chamada de rede (confirmado via log de requisições) |
| AC-5 | ✅ | 3 gastos (2 categorias diferentes); filtrar por "Peças" mostra só o gasto de Peças; "Todas" volta a mostrar os 3 |
| AC-6 | ✅ | Gasto retroativo (2 meses atrás) some com filtro "Este mês", reaparece com "Tudo" |
| AC-7 | ✅ | Filtro por categoria "Seguro" (sem gasto nenhum): mensagem "Nenhum gasto encontrado com esse filtro." — texto diferente do estado vazio de AC-1 |
| AC-8 | ✅ | Edição de categoria (Manutenção→Peças) e valor (150,50→200,00): lista e total refletem a mudança, sem duplicar registro |
| AC-9 | ✅ | Exclusão de gasto com anexo: alerta avisa "O anexo também será apagado."; após confirmar, `expenses` e `attachments` (escopados ao veículo) retornam 0 linhas — nada órfão |
| AC-10 | ✅ | Upload de `recibo-1.png`: "Ver anexo" aparece, 1 linha em `attachments`. Upload de `.txt`: mensagem "Envie uma imagem (JPEG, PNG, WebP) ou um PDF.", nenhum upload iniciado |
| AC-11 | ✅ | Trocar por `recibo-2.png`: `attachments` continua com exatamente 1 linha (a antiga foi removida antes da nova ser inserida — RN-3) |
| AC-12 | ✅ | Remover anexo sem trocar: diálogo mostra "Nenhum anexo", gasto continua existindo, `attachments` volta a 0 linhas |
| AC-13 | ✅ | Dentro de `/v/:id`, tocar "Adicionar" → "Gasto": navega para `/v/:id/gastos` com o diálogo "Registrar gasto" já aberto (via `?novo=1`) |
| AC-14 | ✅ | Em `/` (sem veículo), folha "Adicionar": botão "Gasto" com `aria-disabled="true"` e nome acessível "Gasto — Selecione um veículo" — diferente de "Abastecimento — Em breve" |
| AC-15 | ✅ | Clique em "Gastos" na sidebar (dentro do veículo): `<a>` habilitado, navega para `/v/:id/gastos` |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Achados e correções durante a verificação

1. **Bug real de validação silenciosa** — `paymentMethod: z.enum(PAYMENT_METHODS).optional()` rejeitava `""` (o `<select>` nativo manda string vazia para "Não informado", não `undefined`), travando o submit do formulário de gasto sem nenhuma mensagem de erro visível (o campo nunca teve `<FieldError>` próprio). Descoberto pelo Playwright ao instrumentar o clique do botão "Registrar gasto" e ver zero requisição de rede. Corrigido com o novo helper `optionalEnum` em `lib/schemaHelpers.ts` (ADR-026).
2. **Bug real de layout em 320px** — a tela de Gastos estourava a viewport em ~21px mesmo sem nenhum elemento individualmente mais largo que 320px. Causa: `<main>` é item de um flex row ao lado da `Sidebar` (que vira `display:none` em mobile) e herda `min-width: auto`; o `<select>` de categoria com opção longa ("Financiamento") contribui pro cálculo de largura mínima mesmo estilizado `w-full`. Corrigido com `min-w-0` em `<main>` (`AppShell.tsx`, ADR-025) — benefícia qualquer tela atual/futura com `<select>`, não só Gastos.
3. **Risco real de órfão corrigido preventivamente** — `useDeleteExpense` inicialmente confiava no `expense.attachment` já carregado pela lista; se o usuário anexasse um arquivo e apagasse o gasto antes do cache invalidar/recarregar, o anexo ficaria órfão. Corrigido buscando o anexo direto do servidor no momento da exclusão (ADR-027), fechando a mesma classe de problema resolvida manualmente na Fase 3.
4. Cabeçalho da sidebar/folha "Adicionar" da Fase 3 foi revalidado depois da generalização de `NavItem` (ADR-024): os 8 itens que continuam sem tela mostram "Em breve" normalmente; nenhum item existente mudou de comportamento.

## Saída dos comandos

### Build
```
> slow-garage-web@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 2964 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                 1.67 kB │ gzip:  0.76 kB
dist/assets/index-DGBCcLlD.css                                 22.53 kB │ gzip:  5.27 kB
dist/assets/index-jXUvllph.js                                 179.82 kB │ gzip: 56.97 kB
dist/assets/dist-CUsigxWL.js                                  194.86 kB │ gzip: 62.24 kB
dist/assets/providers-Y48CiEV1.js                             238.06 kB │ gzip: 62.76 kB
dist/assets/router-CXG_s3cE.js                                290.26 kB │ gzip: 85.18 kB

✓ built in 277ms

PWA v1.3.0
mode      generateSW
precache  24 entries (1004.04 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

Nota: `npm run build` (`tsc -b`) pegou 2 erros de tipo reais (constraint
genérica `[string, ...string[]]` incompatível com tupla `readonly` de
`as const`) que `npx tsc --noEmit` isolado não acusou durante a
implementação — `tsc -b` é o check de tipos autoritativo deste projeto
a partir de agora, não só `tsc --noEmit` solto.

### Lint (`eslint .`)
```
> slow-garage-web@0.0.0 lint
> eslint .

(saída vazia — sem erro)
```

### Verificação funcional (script Playwright descartável, autenticado contra o Supabase de dev real)
```
  ok  setup: veículo temporário criado
  ok  AC-15: sidebar 'Gastos' navega pra /v/:id/gastos
  ok  AC-1: estado vazio com botão de registrar o primeiro
  ok  AC-3: submissão vazia é recusada no cliente — diálogo aberto=true erros=3
  ok  AC-4: valor negativo recusado no cliente
  ok  AC-2: gasto aparece no topo da lista — Teste valor negativo
  ok  AC-2: total investido do veículo reflete o gasto — R$ 50.150,50
  ok  AC-8: edição reflete na lista
  ok  AC-10: tipo de arquivo não suportado é recusado
  ok  AC-10: anexo válido sobe e aparece 'Ver anexo'
  ok  AC-10: 1 anexo no banco após o primeiro upload — total=1
  ok  AC-11: trocar anexo mantém só 1 registro — total=1
  ok  AC-11: arquivo antigo não fica órfão no Storage
  ok  AC-12: remover anexo sem trocar, gasto continua existindo
  ok  AC-12: 0 anexos no banco após remover — total=0
  ok  AC-9: excluir avisa que o anexo some junto
  ok  AC-9: gasto e anexo removidos, nada órfão — gastos=0 anexos=0
  ok  desktop: console sem erro (até aqui)
  ok  AC-5: filtro por categoria mostra só a categoria escolhida
  ok  AC-5: 'Todas' volta a mostrar tudo
  ok  AC-6: 'Este mês' esconde o gasto retroativo
  ok  AC-6: 'Tudo' mostra o gasto retroativo de novo
  ok  AC-7: filtro sem resultado mostra mensagem própria (não a de lista vazia)
  ok  AC-13: dentro do veículo, 'Gasto' na folha é um link habilitado
  ok  AC-13: navega pra lista de gastos com o diálogo já aberto
  ok  AC-14: fora do veículo, 'Gasto' desabilitado com motivo certo
  ok  Regressão Fase 3: outros itens da folha continuam 'Em breve'
  ok  axe (folha sem veículo, mobile) sem violação serious/critical
  ok  Regressão Fase 3: sidebar 'Gastos' virou link
  ok  Regressão Fase 3: sidebar 'Dashboard' continua 'Em breve'
  ok  320px: sem overflow horizontal em /v/:id/gastos — {"scrollWidth":320,"innerWidth":320}
  ok  limpeza: veículo temporário removido
  ok  limpeza: nenhum gasto/anexo remanescente do veículo temporário — gastos=0 anexos=0

33/33 checagens passaram.
```

axe-core (`wcag2a`/`wcag2aa`) rodou na folha "Adicionar" aberta em mobile
(390px) sem veículo selecionado — nenhuma violação `serious`/`critical`.
Screenshots revisados visualmente em 320/390/1440px (lista, filtro,
folha, sidebar) — sem texto cortado, sem sobreposição, densidade
consistente com `DESIGN.md`.

## Pendências

Nenhuma.

## Para o humano testar na mão

1. Registrar um gasto de verdade num veículo real, conferir que o
   "Total investido" do header muda e que a mudança também aparece no
   card da garagem (`/`).
2. Anexar uma foto de recibo tirada pelo celular (não um PNG de 1×1
   como o usado na verificação automatizada) e conferir que "Ver
   anexo" abre a imagem de verdade numa aba nova.
3. Testar o filtro de período perto da virada do mês, pra confirmar
   que "Este mês"/"Mês passado" batem com o calendário local.
4. Testar em leitor de tela que "Gasto — Selecione um veículo" e
   "Abastecimento — Em breve" são anunciados de forma distinguível.
