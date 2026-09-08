# Verificação 020 — Assistente FIPE

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-05 |
| **Resultado** | aprovado — fluxo completo verificado, inclusive submit real |
| **Complementado em** | 2026-09-05 — AC-8 com falhas induzidas, fluxo de edição e submit real no banco |

## Como foi verificado

Em duas rodadas, por uma razão prática: a conta de teste
(`e2e-test@dev.local`) tinha sido apagada, e o Supabase recusa criar
conta em domínio `.dev.local` (`email_address_invalid`).

**Rodada 1 — sem autenticação.** O formulário foi exercitado por uma
**rota temporária** (`/__fipe-check` e `/__fipe-edit`), montando o
`VehicleForm` e o `EditVehicleDialog` isolados, com um veículo fabricado
em memória. Nada foi gravado no banco. Cobriu todos os ACs de
comportamento de tela, as falhas induzidas e o fluxo de edição. A rota e
o harness foram removidos antes do commit — confirmado com `grep` (zero
ocorrências) e `git diff` do `router.tsx` (idêntico ao commitado).

**Rodada 2 — autenticada, contra o banco real.** Com a conta de teste
fornecida pelo usuário, o `INSERT` e o `UPDATE` foram executados de
verdade pelo app, com reload entre salvar e conferir. Os veículos criados
receberam placa marcadora (`ZZF####`) e foram apagados no fim — ver
"Submit real no Supabase".

Ou seja: a rota temporária provou o comportamento da interface sem tocar
em dado; a rodada autenticada provou a persistência. Nenhuma das duas
deixou resíduo.

## Critérios de aceite

Roteiro completo executado em **320px (escuro), 390px (claro) e 1440px
(escuro)** — resultado idêntico nos três.

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | `bloco existe: true` · `nasce fechado: aria-expanded=false` · `campo manual aceita digitação: true` (digitou marca/modelo antes de abrir o bloco) |
| AC-2 | ✅ | Digitou "Peugeot" no filtro → `marca escolhida: "Peugeot"`; digitou "308" → `modelo escolhido: "308 Active 1.6 Flex 16V 5p mec."` |
| AC-3 | ✅ | Após escolher o modelo: `ano sob demanda: link=true combobox_de_ano_ainda_ausente=true` — o combobox de ano **não existe** no DOM até o clique explícito |
| AC-4 | ✅ | `preencheu make="Peugeot" model="308 Active 1.6 Flex 16V 5p mec."` nos `<input>` de texto livre |
| AC-5 | ✅ | `modelYear após preencher com ano escolhido: "2015"` |
| AC-6 | ✅ | `valor exibido: Valor de referência: R$ 48.849,00`; só após clicar → `estimatedCurrentValue="48849"`. Tela mostra "Tabela FIPE de setembro de 2026 · código 024186-5. É uma sugestão — o campo continua editável" |
| AC-7 | ✅ | `colapsou=true \| preservou make=true valor=true` |
| AC-8 | ✅ | Quatro falhas **induzidas de verdade** via `page.route` — ver "Falhas induzidas". Cada tipo produziu sua mensagem, o formulário manual seguiu intacto e nenhuma exceção escapou |
| AC-9 | ✅ | `overflow: 320 vs 320 ok`, `390 vs 390 ok`, `1440 vs 1440 ok`; `axe: 0 violações, 0 serious/critical` nos três, com o bloco **aberto**; `console: nenhum erro` |

## Saída dos comandos

### Roteiro do bloco (320px escuro — idêntico em 390 e 1440)
```
bloco existe: true
nasce fechado: aria-expanded=false
campo manual aceita digitação: true
abriu: aria-expanded=true
marca escolhida: "Peugeot"
modelo escolhido: "308 Active 1.6 Flex 16V 5p mec."
ano sob demanda: link=true combobox_de_ano_ainda_ausente=true
preencheu make="Peugeot" model="308 Active 1.6 Flex 16V 5p mec."
ano escolhido: "2015 Flex"
valor exibido: Valor de referência: R$ 48.849,00
estimatedCurrentValue="48849"
modelYear após preencher com ano escolhido: "2015"
colapsou=true | preservou make=true valor=true
overflow: 320 vs 320 ok
axe: 0 violações, 0 serious/critical
console: nenhum erro
```

### `ui-check.mjs` (bloco fechado, estado padrão)
```
  ok  320         /__fipe-check
  ok  390         /__fipe-check
  ok  768         /__fipe-check
  ok  1440        /__fipe-check
  ok  390-teclado /__fipe-check

Nenhum problema automático.
```

### Tipos, lint e build
```
$ npx tsc --noEmit
TSC ok

$ npm run lint
> eslint .
(sem saída — passou)

$ npm run build
precache  84 entries (1287.17 KiB)
(build concluído)
```

### API externa — forma confirmada antes de codar
```
/marcas                     → 200, 107 marcas, CORS: access-control-allow-origin: *
/marcas/21/modelos          → 200, 585 modelos (Fiat)
/marcas/21/modelos/437/anos → 200, [{"codigo":"1987-1","nome":"1987 Gasolina"}, ...]
/marcas/.../anos/1987-1     → 200, {"Valor":"R$ 6.136,00","MesReferencia":"setembro de 2026", ...}
latência observada: 0,5s a 1,2s
```

## Achado corrigido durante a verificação

O `eslint-plugin-jsx-a11y` reprovou a primeira versão do combobox:
`role="combobox"` exige `aria-controls` e `aria-expanded`. Corrigido com
`useId` ligando o gatilho à `Command.List` mais `aria-haspopup="listbox"`.
Sem o lint, isso teria passado — o axe só avalia o que está renderizado, e
a lista só existe com o popover aberto.

## Falhas induzidas na API externa (AC-8)

Interceptando `**parallelum.com.br/**` no Playwright, com o bloco aberto
e o formulário manual já preenchido antes da falha:

| Cenário | Mensagem exibida | Formulário manual | Exceção |
|---|---|---|---|
| Rede caiu (`abort`) | "Não foi possível falar com a FIPE. Verifique a conexão ou preencha à mão." | intacto, "Salvar" habilitado | nenhuma |
| HTTP 500 | "A FIPE respondeu com erro (500). Tente de novo ou preencha à mão." | intacto, "Salvar" habilitado | nenhuma |
| JSON inválido | "A FIPE devolveu uma resposta inesperada. Preencha à mão." | intacto, "Salvar" habilitado | nenhuma |
| Timeout (resposta retida 12s, limite de 10s) | "A consulta à FIPE demorou demais. Tente de novo ou preencha à mão." | intacto, "Salvar" habilitado | nenhuma |

No estado de erro: `axe: 0 violações (0 serious/critical)`. Screenshot
`.ui-check/fipe-erro-http500.png` — a mensagem aparece sob o combobox
afetado, "Preencher com dados FIPE" fica desabilitado, e os campos
manuais seguem com o que foi digitado.

## Fluxo de edição (`EditVehicleDialog` real)

Diálogo montado com um veículo pré-carregado (Peugeot / "308 antigo" /
2014 / R$ 47.000), em 390px e 1440px — resultado idêntico:

```
diálogo de edição aberto: true
valores pré-carregados: make="Peugeot" model="308 antigo" valor="47000"
assistente presente na edição: true · fechado=true
escolheu: Peugeot / 308 Active 1.6 Flex 16V 5p mec.
ano: 2015 Flex
SOBRESCREVEU o que existia:
  model: "308 antigo" -> "308 Active 1.6 Flex 16V 5p mec."
  ano: "2014" -> "2015"
  valor: "47000" -> "48849"
campo não tocado preservado: placa="PAZ5333" km="105000"
overflow: ok · axe: 0 violações · console: nenhum erro
```

Confirma que o assistente nasce fechado também na edição, que preencher
**sobrescreve** valor já existente (comportamento desejado — é o usuário
pedindo), e que campo fora do alcance do assistente (placa, km) não é
tocado.

## Submit real no Supabase (`INSERT` e `UPDATE`)

Executado no app autenticado, com conta de teste fornecida pelo usuário,
contra o banco real. Cada veículo criado recebeu uma placa marcadora
(`ZZF####`) pra ser localizado e apagado no fim.

```
login: OK
veículos na garagem antes: 1

===== INSERT via assistente =====
formulário preenchido pela FIPE: {"make":"Peugeot","model":"308 Active 1.6 Flex 16V 5p mec.","year":"2015","value":"48849"}
placa marcadora: ZZF8994
diálogo fechou (submit aceito): true
veículos na garagem depois: 2 (antes 1)
card do veículo novo contém a placa: true
card menciona o modelo da FIPE: true

===== persistência após reload =====
veículos após reload: 2 · placa ZZF8994 presente: true

===== UPDATE via assistente =====
abriu edição com model="308 Active 1.6 Flex 16V 5p mec."
trocado para: make="Fiat" model="Uno 1.6 mpi 2p e 4p"
UPDATE persistiu após reload ("Uno 1.6 mpi 2p e 4"): true

===== limpeza =====
  apagado: ZZF8994
  apagado: ZZF5307
veículos ao final: 0 · marcador ZZF ainda presente: false

erros de console: nenhum
```

O **reload** entre salvar e conferir é o que prova persistência: o valor
foi buscado do banco de novo, não lido do cache do React Query.

Screenshot `.ui-check/fipe-submit-criado.png` — o veículo salvo aparece
na garagem como "Peugeot 308 Active 1.6 Flex 16V 5p mec. · ZZF8994 ·
2015", exatamente o que a FIPE preencheu.

`Total investido R$ 0,00` no card é **correto**: esse número vem de preço
de compra + gastos pela view do banco, não do valor estimado atual que o
assistente sugeriu. Confirma na prática a RN-1 — o que a FIPE preencheu
não virou dado calculado.

**Nenhum resíduo ficou no banco.** A limpeza apagou os dois veículos de
teste (o desta execução e um órfão de uma execução anterior que falhou no
meio), e a garagem voltou a zero.

## Pendências

- **Persistir a seleção não foi implementado** — as colunas
  `fipe_brand_id`/`fipe_model_id` não existem no schema. Ver §11 da spec e
  o ADR-075. Esta é a única pendência restante da fase, e depende do
  backend.

## Para o humano testar na mão

Nada obrigatório — o fluxo completo foi percorrido de ponta a ponta.
Opcional: usar o assistente num carro que **não** esteja na FIPE e
confirmar que "Não encontrei meu carro" resolve o caminho manual sem
atrito.
