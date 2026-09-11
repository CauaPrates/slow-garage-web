# Templates — tasks.md e verification.md

---

## tasks.md

Cada task é atômica: implementável e verificável sozinha, e deixa o repositório compilando. Toda task aponta para um AC. Task sem AC é escopo que apareceu do nada.

```markdown
# Tasks NNN — <título>

| | |
|---|---|
| **Spec** | ./spec.md |
| **Plano** | ./plan.md |

| # | Task | Arquivos | AC | Depende de | Status |
|---|---|---|---|---|---|
| 1 | Teste de <comportamento> | `x.test.ts` | AC-1 | — | ☐ |
| 2 | Implementar <comportamento> | `x.ts` | AC-1 | 1 | ☐ |
| 3 | ... | | | | ☐ |

Status: ☐ pendente · ◐ em andamento · ☑ feita · ✖ bloqueada

## Bloqueios

Registre aqui o que travou e o que precisa de decisão humana. Se algo
está bloqueado, reporte na conversa — não deixe só no arquivo.

## Escopo recusado durante a implementação

O que apareceu como necessário mas não estava na spec. Registre em vez de
implementar de brinde. O humano decide se entra agora, depois, ou não
entra.

| O que apareceu | Por que apareceu | Decisão |
|---|---|---|
```

---

## verification.md

Este documento existe para uma única finalidade: impedir que "pronto" seja opinião.

**Nada aqui é escrito sem a saída literal do comando que provou.** Se um comando não foi rodado, o resultado é "não verificado" — nunca ✅ por dedução.

```markdown
# Verificação NNN — <título>

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | AAAA-MM-DD |
| **Resultado** | aprovado / reprovado / parcial |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | `expenses.test.ts > recusa gasto sem valor` — passou |
| AC-2 | ❌ | falha: <mensagem literal> |
| AC-3 | ⚠️ | funciona em desktop, não testado em 320px |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

"Implementado conforme especificado" não é evidência. Evidência é nome de
teste que passou, saída de comando, ou passo manual exato que o humano
pode repetir e obter o mesmo resultado.

## Saída dos comandos

Colar literal. Sem resumir, sem parafrasear, sem cortar o que
incomoda.

### Build
```
<saída>
```

### Testes
```
<saída>
```

### Lint / tipos
```
<saída>
```

## Pendências

O que não ficou pronto e por quê. Sem eufemismo.

## Para o humano testar na mão

Lista numerada do que só pessoa consegue conferir: comportamento visual,
fluxo em dispositivo real, integração com serviço externo, sensação de
uso.

1. ...
```

---

## Nota sobre honestidade de relatório

O incentivo natural, ao final de uma implementação longa, é entregar verde. Resista.

Um relatório que diz "AC-4 não atendido, o cálculo quebra quando não há registro anterior, precisa de decisão sobre o comportamento esperado" vale mais do que dez ✅ que o humano vai descobrir falsos na primeira vez que usar. A segunda opção não economiza tempo — só transfere o custo para um momento pior, e queima a confiança que faz o ciclo funcionar.
