# Verificação 020 — Assistente FIPE

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-05 |
| **Resultado** | aprovado, com pendência de backend (§ Pendências) |
| **Complementado em** | 2026-09-05 — AC-8 com falhas induzidas e fluxo de edição percorrido |

## Como foi verificado

A conta de teste (`e2e-test@dev.local`) foi apagada pelo usuário antes
desta fase, e o Supabase recusa criar conta em domínio `.dev.local`
(`email_address_invalid`). Criar uma conta nova deixaria resíduo no banco
de produção que a `anon key` não consegue remover.

Em vez disso, o formulário foi exercitado por uma **rota temporária sem
autenticação** (`/__fipe-check`), montando o `VehicleForm` isolado. Nada
foi gravado no banco. A rota e o harness foram removidos antes do commit
— confirmado com `grep` (zero ocorrências) e `git diff` do `router.tsx`
(idêntico ao commitado).

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

## Pendências

- **Persistir a seleção não foi implementado** — as colunas
  `fipe_brand_id`/`fipe_model_id` não existem no schema. Ver §11 da spec e
  o ADR-075.
- **O `submit` real não foi exercitado.** A verificação cobriu o
  formulário e o diálogo de edição, mas não o `INSERT`/`UPDATE` no
  Supabase: a conta de teste foi apagada e criar outra deixaria resíduo no
  banco de produção. Esta fase não toca o caminho de submit — o
  assistente só chama `setValue` — mas fica registrado como não executado.

## Para o humano testar na mão

1. Cadastrar um veículo de verdade pelo app usando o assistente e
   confirmar que ele salva normalmente.
2. Salvar um veículo **editado** com o assistente e confirmar que o
   `UPDATE` grava o que apareceu na tela.
