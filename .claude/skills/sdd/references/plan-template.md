# Template — plan.md

O plano traduz a spec em decisão técnica. Ele responde "como", e responde também "por que não do outro jeito".

Se em algum ponto o plano precisar contradizer a spec, pare: o erro está na spec. Volte, corrija e reaprove.

---

```markdown
# Plano NNN — <título>

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | rascunho / aguardando aprovação / aprovado |

## 1. Abordagem

O caminho escolhido, em um parágrafo. Direto.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|

Duas ou três linhas por item. Esta seção é o que transforma o plano em
registro de decisão em vez de lista de tarefas — em seis meses, é aqui
que alguém descobre por que o sistema é assim.

## 3. Impacto em contratos e dados

Mudança de schema, de API, de tipos compartilhados, de formato de
arquivo. O que quebra para quem consome. Se nada muda, escreva
"nenhum" — a ausência é informação.

Se houver migration ou mudança de dado existente: o que acontece com os
registros que já estão lá.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `caminho/arquivo.ts` | criar / modificar / remover | uma linha |

Se você não consegue escrever o propósito em uma linha, o arquivo está
fazendo coisa demais. Reveja antes de continuar.

## 5. Ordem de execução

Sequência com a dependência explícita. Contrato antes de consumidor,
dado antes de interface, teste antes de implementação.

1. ...

## 6. Cobertura dos critérios de aceite

Todo AC precisa de linha. AC sem cobertura é AC que ninguém vai conferir.

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | nome do teste, ou passo manual exato | automático / manual |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|

Mitigação é ação concreta. "Ter cuidado" e "testar bem" não são
mitigação.

## 8. Rollback

Como desfazer se a entrega quebrar algo em uso. Para migration de banco,
seja específico: o que é reversível e o que não é.

## 9. Definição de pronto

Checklist objetivo desta entrega. Marcável, não interpretável.

- [ ] Todos os ACs verificados com evidência
- [ ] Build passa
- [ ] Testes passam
- [ ] Lint e checagem de tipo passam
- [ ] Documentação afetada atualizada
- [ ] ...
```
