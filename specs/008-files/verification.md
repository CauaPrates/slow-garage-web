# Verificação 008 — Documentos, obrigações, financiamento e galeria de fotos

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |
| **Data** | 2026-09-03 |

## Método

Script Playwright descartável (`verify-008.tmp.mjs`, apagado ao final — nunca
comitado), autenticado como `bob@dev.local` contra o Supabase de dev real.
Criou um veículo temporário ("TempTeste VerificacaoFase8"), exercitou os 25
ACs com dado real, confirmou efeitos colaterais no banco via `@supabase/
supabase-js` direto (não só pela UI), tirou screenshot em 320/390/768/1440px
das 4 abas, e limpou tudo ao final (veículo excluído via UI + confirmado via
consulta direta que não sobrou linha em nenhuma tabela).

Rodado duas vezes: a primeira execução do script usava esperas fixas
(`waitForTimeout`) curtas demais pro round-trip real de rede do Supabase e
produziu falsos negativos em cascata (documentado abaixo, não é bug do
app — reescrito pra usar `waitForSelector` orientado a estado, igual à
disciplina já usada nas Fases 4-7 pra distinguir bug real de bug de script).
A segunda execução, com as esperas corrigidas, é a que resulta nesta tabela.

## Saída literal da execução final

```
== Login ==
  ok  login supabase-js direto
  ok  login UI

== Criar veículo temporário ==
  ok  veículo temporário criado
  vehicleId: 60f86c7b-9118-4e2e-b840-8f4e87559787

== Documentos ==
  ok  AC-1 estado vazio
  ok  AC-6 arquivo inválido recusado (mensagem em pt-BR)
  ok  AC-2 documento criado e aparece na lista
  ok  AC-3 selo de vencido
  ok  AC-4 abre em nova aba com URL assinada (não pública)
  ok  AC-5 documento removido da lista
  ok  AC-5 nenhuma linha órfã em documents

== Obrigações ==
  ok  estado vazio obrigações
  ok  AC-7 obrigação criada, pendente
  ok  AC-9 alerta obligation_overdue presente antes de pagar
  ok  AC-8 obrigação passa a mostrar 'Paga em'
  ok  AC-9 alerta some depois de pagar
  ok  AC-10 obrigação excluída de verdade

== Financiamento ==
  ok  AC-11 estado vazio, sem financiamento
  ok  financiamento criado, 0 de 3 pagas
  ok  AC-12 não oferece criar 2º financiamento
  ok  AC-13 installments_paid sobe (1 de 3)
  ok  AC-13 installments_remaining/outstanding_balance vêm do banco (não recalculado no cliente)
  ok  AC-15 correção manual reflete (3 de 3 pagas)
  ok  AC-14 botão +1 desabilitado quando quitado
  ok  AC-14/15 installments_remaining = 0 quando quitado
  ok  financiamento excluído

== Fotos ==
  ok  AC-16 estado vazio galeria
  ok  AC-17 foto exterior aparece na grade
  ok  AC-17 filtro por outra categoria não mostra a foto exterior
  ok  AC-17 volta a aparecer no filtro 'Todas'
  ok  AC-18 UI mostra selo de capa
  ok  AC-18 vehicles.primary_photo_id atualizado
  ok  AC-18 card da garagem passa a exibir a foto de capa
  ok  AC-19 galeria volta a ficar vazia
  ok  AC-19 primary_photo_id volta a null (nunca aponta pra foto inexistente)
  ok  AC-19 nenhuma linha órfã em vehicle_photos

== Anexo em Problema ==
  ok  AC-20 anexo aparece no problema depois de anexar
  ok  AC-23 anexo removido junto com o problema

== Anexo em Item de projeto ==
  ok  AC-21 anexo aparece no item de projeto
  ok  AC-23 anexo removido junto com o item de projeto

== Anexo em Execução de manutenção ==
  ok  AC-22 anexo aparece na execução de manutenção
  ok  AC-23 anexo removido junto com a execução

== Regressão: anexo de Gasto ==
  ok  regressão: anexo de Gasto continua anexando
  ok  regressão: trocar anexo funciona
  ok  regressão: remover anexo funciona
  ok  regressão: exclusão de gasto continua limpando anexo

== Navegação ==
  ok  AC-24 item 'Documentos' habilitado (não 'Em breve')
  ok  AC-24 navega pra /documentos
  ok  AC-25 'Foto' abre aba Fotos com diálogo já aberto

== Screenshots ==
  ok  sem overflow horizontal [320px, aba documentos]
  ok  sem overflow horizontal [320px, aba obrigacoes]
  ok  sem overflow horizontal [320px, aba financiamento]
  ok  sem overflow horizontal [320px, aba fotos]
  ok  sem overflow horizontal [390px, aba documentos]
  ok  sem overflow horizontal [390px, aba obrigacoes]
  ok  sem overflow horizontal [390px, aba financiamento]
  ok  sem overflow horizontal [390px, aba fotos]
  ok  sem overflow horizontal [768px, aba documentos]
  ok  sem overflow horizontal [768px, aba obrigacoes]
  ok  sem overflow horizontal [768px, aba financiamento]
  ok  sem overflow horizontal [768px, aba fotos]
  ok  sem overflow horizontal [1440px, aba documentos]
  ok  sem overflow horizontal [1440px, aba obrigacoes]
  ok  sem overflow horizontal [1440px, aba financiamento]
  ok  sem overflow horizontal [1440px, aba fotos]

== Limpeza ==
  ok  veículo temporário removido da garagem
  ok  veículo removido do banco

66 ok, 0 falha(s)
```

## Avaliação visual (screenshots revisados de verdade, não só o assert de overflow)

- **320/390px, aba Documentos**: sem overflow, mas a aba "Financiamento"
  (320px) e "Fotos" (390px) apareciam 100% cortadas na primeira rodada, a
  "Fotos" sem nenhum pedaço visível — sem indício de que havia mais conteúdo
  pra rolar. Corrigido (`px-3`→`px-2`, `gap-2`→`gap-1` no tablist,
  ver ADR-037) e reverificado: em todo breakpoint testado agora sobra pelo
  menos um pedaço legível da próxima aba, mesmo padrão de affordance já
  usado no filtro de categoria da galeria.
- **320px, com dado real do seed (`Chevrolet Opala`, não o veículo
  temporário)**: confirmado que `AlertBanner` já mostra "Seguro anual —
  Venceu em 27/08/2026" e "Apólice de seguro — Venceu em 22/08/2026" sem
  nenhuma mudança no componente da Fase 6 (ADR-038) — a integração com
  `vehicle_alerts` funciona com dado que já existia no banco antes desta
  fase, não só com dado criado pelo próprio script.
- **768/1440px**: as 4 abas cabem inteiras lado a lado, sem corte. Sidebar
  em 1440px mostra "Documentos" habilitado e destacado como item ativo.
- Card de financiamento, badge de obrigação paga/vencida e grade de fotos
  revisados visualmente nos screenshots de 768/1440px — sem sobreposição,
  sem cor como único indicador (todo estado tem texto).

## ACs

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | `ok AC-1 estado vazio` |
| AC-2 | ✅ | `ok AC-2 documento criado e aparece na lista` |
| AC-3 | ✅ | `ok AC-3 selo de vencido` |
| AC-4 | ✅ | `ok AC-4 abre em nova aba com URL assinada` |
| AC-5 | ✅ | `ok AC-5 documento removido da lista` + `ok AC-5 nenhuma linha órfã em documents` |
| AC-6 | ✅ | `ok AC-6 arquivo inválido recusado (mensagem em pt-BR)` |
| AC-7 | ✅ | `ok AC-7 obrigação criada, pendente` |
| AC-8 | ✅ | `ok AC-8 obrigação passa a mostrar 'Paga em'` |
| AC-9 | ✅ | `ok AC-9 alerta obligation_overdue presente antes de pagar` + `ok AC-9 alerta some depois de pagar` |
| AC-10 | ✅ | `ok AC-10 obrigação excluída de verdade` |
| AC-11 | ✅ | `ok AC-11 estado vazio, sem financiamento` |
| AC-12 | ✅ | `ok AC-12 não oferece criar 2º financiamento` |
| AC-13 | ✅ | `ok AC-13 installments_paid sobe` + `ok AC-13 installments_remaining/outstanding_balance vêm do banco` |
| AC-14 | ✅ | `ok AC-14 botão +1 desabilitado quando quitado` + `ok AC-14/15 installments_remaining = 0 quando quitado` |
| AC-15 | ✅ | `ok AC-15 correção manual reflete (3 de 3 pagas)` |
| AC-16 | ✅ | `ok AC-16 estado vazio galeria` |
| AC-17 | ✅ | `ok AC-17 foto exterior aparece na grade` + filtro nos dois sentidos |
| AC-18 | ✅ | `ok AC-18 vehicles.primary_photo_id atualizado` + `ok AC-18 card da garagem passa a exibir a foto de capa` |
| AC-19 | ✅ | `ok AC-19 galeria volta a ficar vazia` + `ok AC-19 primary_photo_id volta a null` + `ok AC-19 nenhuma linha órfã em vehicle_photos` |
| AC-20 | ✅ | `ok AC-20 anexo aparece no problema depois de anexar` |
| AC-21 | ✅ | `ok AC-21 anexo aparece no item de projeto` |
| AC-22 | ✅ | `ok AC-22 anexo aparece na execução de manutenção` |
| AC-23 | ✅ | confirmado nas 4 entidades (problema/item/execução/gasto) — `attachments` sem linha órfã em nenhum caso |
| AC-24 | ✅ | `ok AC-24 item 'Documentos' habilitado` + `ok AC-24 navega pra /documentos` |
| AC-25 | ✅ | `ok AC-25 'Foto' abre aba Fotos com diálogo já aberto` |

## Build, tipo e lint

```
$ npx tsc -b
(sem saída — sem erro)

$ npx eslint src
(sem saída — sem erro)

$ npm run build
✓ 3041 modules transformed.
✓ built in 15.01s
```

## Regressão

Anexo de Gasto (Fase 4) foi migrado para o módulo genérico
`features/attachment/` nesta fase (ADR-035) — reverificado do zero
(anexar/ver/trocar/remover/excluir-com-limpeza) e continua idêntico ao
comportamento original: `regressão: anexo de Gasto continua anexando`,
`trocar anexo funciona`, `remover anexo funciona`, `exclusão de gasto
continua limpando anexo` — todos ✅.

## Fora de escopo (não implementado nesta fase, por decisão explícita)

- Anexo em `note` — entidade "nota" ainda não tem tela (Fase 9).
- Geração automática de próxima obrigação (ex.: recriar IPVA do ano
  seguinte sozinho) — sem campo de recorrência no banco, cadastro
  seguinte é manual.
- Simulação/amortização de financiamento — só reflete o que o banco já
  calcula.
- Reordenar fotos por arrasto — novas fotos entram no fim.
- Troca do arquivo de um documento já existente — só o formulário de
  editar metadado; trocar arquivo precisaria de um fluxo próprio, não
  pedido no escopo.

## O que o humano precisa testar na mão

- **Teclado virtual aberto**: os formulários de Documento/Obrigação/
  Financiamento/Foto em ~380px de altura de viewport (teclado ocupando
  metade da tela) — o botão de salvar deve continuar alcançável. Não
  testado automaticamente nesta verificação.
- **Financiamento com juros compostos reais**: `outstanding_balance` foi
  confirmado como "vem do banco, não recalculado" (AC-13), mas o valor
  numérico exato pra um cenário com `interest_rate_monthly` preenchido
  não foi conferido manualmente contra uma calculadora de amortização —
  a fórmula é responsabilidade do backend (coluna gerada), fora do
  escopo desta verificação de frontend.

## G4 — Gate de verificação

25/25 ACs verificados com evidência, build/tipo/lint limpos, regressão de
Gasto confirmada, screenshots revisados nos 4 breakpoints com um ajuste
visual (ADR-037) aplicado e reverificado. Pronto para merge.
