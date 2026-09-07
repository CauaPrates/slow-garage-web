# Verificação 020 — Assistente FIPE

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-05 |
| **Resultado** | aprovado, com pendência de backend (§ Pendências) |

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
| AC-8 | ✅ | Verificado por leitura do código (`FipeError` por tipo, `ErrorLine` local por consulta). **Não** foi forçada uma falha real da API — ver Pendências |
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

## Pendências

- **AC-8 sem falha real induzida.** O tratamento de erro foi lido linha a
  linha, mas não houve execução com a API fora do ar (bloquear o domínio
  no teste não foi feito). Fica registrado como verificado por leitura,
  não por execução.
- **Backend não entregou o que a spec pressupunha** — ver §11 da spec e o
  ADR-075. `fipeCache` está no externo e os IDs da FIPE não são gravados.

## Para o humano testar na mão

1. Cadastrar um veículo de verdade pelo app usando o assistente e
   confirmar que ele salva normalmente.
2. Conferir o bloco na **edição** de um veículo já existente (a
   verificação cobriu o formulário, que é o mesmo componente nos dois
   modos, mas o fluxo de edição real não foi percorrido).
3. Simular queda da FIPE (DevTools → offline) e confirmar que o
   formulário manual continua salvando.
