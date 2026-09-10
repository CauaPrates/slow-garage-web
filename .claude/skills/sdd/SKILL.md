---
name: sdd
description: Desenvolvimento orientado a especificação (Spec-Driven Development). Conduz qualquer trabalho novo pelo ciclo spec → plano → tasks → implementação → verificação, com gates de aprovação humana e proibição de inventar requisito. Use SEMPRE que o usuário pedir uma feature nova, um módulo, uma fase de roadmap, uma refatoração grande ou uma correção não trivial — mesmo que ele não diga "spec", "SDD" ou "especificação". Gatilhos: "quero implementar X", "vamos fazer a fase N", "preciso adicionar", "monta pra mim", "como a gente estrutura", "cria essa tela/tabela/endpoint", "levanta os requisitos", "spec disso", "critérios de aceite", "o que falta pra considerar pronto". Ative também quando a demanda chegar vaga, ambígua ou grande demais para uma tacada só, e quando o usuário pedir para verificar se algo realmente ficou pronto.
---

# SDD — Spec-Driven Development

Código é a consequência de uma decisão, não o lugar onde ela é tomada. Esta skill existe para impedir o modo de falha mais caro em trabalho assistido por IA: implementar rápido a coisa errada, com convicção, e só descobrir na revisão.

O ciclo tem cinco etapas e quatro gates. Nenhum gate é decorativo.

```
CLARIFY → SPEC ─G1─▶ PLAN ─G2─▶ TASKS ─G3─▶ IMPLEMENT ─G4─▶ VERIFY
```

## Regra que governa tudo

**Você não tem permissão para inventar requisito.**

Se um detalhe necessário não está na demanda, no repositório ou em documento existente, ele não existe. Marque `[NEEDS CLARIFICATION: pergunta específica]` no lugar e pergunte. Nunca preencha lacuna com o padrão da indústria, com o que "faz sentido" ou com o que você viu em projeto parecido.

Isso vale especialmente para: regra de negócio, comportamento em erro, quem pode ver o quê, o que acontece com dado já existente, e o que conta como "pronto".

## Etapa 0 — Triagem

Antes de qualquer coisa, leia o que já existe: `CLAUDE.md`, `README.md`, `docs/`, specs anteriores em `specs/`, e o código da área afetada. Metade das perguntas que você faria já está respondida no repo, e perguntar o que está escrito queima a paciência do humano.

Depois classifique o tamanho:

| Tamanho | Sinal | Ciclo |
|---|---|---|
| **P** | 1 arquivo, sem nova regra de negócio, sem novo dado | Spec enxuta (contexto + ACs + escopo) → implementa → verifica. Sem plano nem tasks |
| **M** | Poucos arquivos, alguma regra nova, sem mudança de contrato | Ciclo completo, plano curto |
| **G** | Novo dado, novo contrato, migration, mudança de segurança, ou toca mais de um módulo | Ciclo completo, plano detalhado, tasks obrigatórias |

Diga a classificação e o motivo em uma linha. Se estiver na fronteira, suba um nível — o custo de especificar demais é minutos, o de especificar de menos é retrabalho.

## Etapa 1 — Clarify

Entreviste **por blocos**, no máximo 3 perguntas por rodada, começando pelo que mais muda o desenho. Perguntar 20 coisas de uma vez produz respostas rasas.

Ordem dos blocos, porque a resposta de cada um restringe o próximo:

1. **Problema** — que dor isso resolve, e para quem. Se a resposta for "porque está no roadmap", insista: o que fica pior se não existir?
2. **Comportamento** — o caminho principal, contado como história do usuário
3. **Fronteira** — o que explicitamente **não** entra
4. **Dados** — que informação nasce, muda ou é lida
5. **Regra e exceção** — o que é proibido, o que é obrigatório, o que acontece quando dá errado
6. **Pronto** — como o humano vai saber que funcionou

Antes de fechar a entrevista, faça uma passada de reflexão técnica: releia as respostas e liste onde você ainda tem margem para interpretação. Cada margem é uma pergunta, não um chute.

Loop de fechamento: escreva a spec, conte os `[NEEDS CLARIFICATION]`, pergunte os pendentes, reescreva. Repita até zero. **Zero é o critério, não "poucos".**

## Etapa 2 — Spec

Escreva em `specs/NNN-slug-curto/spec.md`, onde `NNN` é sequencial de três dígitos. Use o template em `references/spec-template.md`.

A spec descreve **o quê** e **por quê**. Nada de nome de arquivo, biblioteca, tabela ou assinatura de função — isso é plano. Se você está escrevendo `useState` ou `create table` numa spec, está na etapa errada.

Os critérios de aceite carregam o peso do documento. Cada um precisa ser:

* numerado (`AC-1`, `AC-2`) — para o plano, as tasks e a verificação poderem referenciar
* verificável por alguém que não escreveu o código
* escrito como comportamento observável, não como implementação

```
❌ AC-3: O formulário valida os campos corretamente.
❌ AC-3: Usar zod para validar o schema do formulário.
✅ AC-3: Dado um abastecimento sem quilometragem, quando o usuário salva,
         então o sistema recusa o registro e indica o campo faltante,
         e nenhum dado é persistido.
```

**G1 — Gate de spec.** Apresente a spec e pare. Diga explicitamente: "Nenhum código foi escrito. Preciso do seu OK na spec." Não avance por conta própria, nem "adiante um pouco enquanto ele lê".

## Etapa 3 — Plan

Em `specs/NNN-slug/plan.md`, template em `references/plan-template.md`.

Aqui entra o **como**. O que este documento precisa fazer bem:

* **Registrar a alternativa descartada e o motivo.** Um plano que só mostra o caminho escolhido esconde a decisão. Duas ou três linhas por alternativa bastam
* **Listar os arquivos** a criar e modificar, com o propósito de cada um. Se a lista tem um arquivo cujo propósito você não consegue escrever em uma linha, ele não deveria existir
* **Amarrar teste a AC.** Cada AC precisa de pelo menos um teste ou uma checagem manual nomeada. AC sem cobertura é AC que ninguém vai verificar
* **Nomear o risco técnico** com a mitigação, não com "vamos ter atenção"

Se o plano contradiz a spec, o erro está na spec. Volte, corrija, reaprove. Não resolva a contradição silenciosamente no plano.

**G2 — Gate de plano.** Apresente e pare.

## Etapa 4 — Tasks

Em `specs/NNN-slug/tasks.md`, template em `references/tasks-template.md`.

Cada task é atômica: implementável e verificável isoladamente, e deixa o repositório em estado que compila. Toda task aponta para o AC que atende. Task sem AC é escopo que apareceu do nada — remova ou volte para a spec.

Ordene por dependência real, e dentro disso: teste antes de implementação, dado antes de interface, contrato antes de consumidor.

**G3 — Gate de tasks.** Confirme a ordem antes de começar. É o momento mais barato de cortar escopo.

## Etapa 5 — Implement

Uma task por vez. Ao concluir cada uma, marque em `tasks.md` e siga. Não pule para a próxima com a anterior meio pronta.

Três coisas que fazem o ciclo desandar nesta etapa:

* **Escopo que cresce.** Se durante a implementação você identificar algo necessário que não está na spec, **pare e reporte**. Não implemente "de brinde". O humano decide se entra agora, entra depois ou não entra
* **Desvio de plano.** Se o plano se mostrar errado na prática, diga qual parte e por quê, e proponha a correção. Não improvise em silêncio
* **Duplicação.** Antes de criar helper, componente ou tipo, procure se já existe. Reaproveitar é mais importante do que ficar bonito

## Etapa 6 — Verify

Em `specs/NNN-slug/verification.md`.

**Esta é a etapa que impede alucinação de conclusão.** A regra é dura de propósito:

> Nunca escreva que algo funciona sem colar a saída literal do comando que provou isso.

Para cada AC, uma linha com: id, resultado (✅ / ❌ / ⚠️ parcial), e a **evidência** — nome do teste que passou, saída do comando, ou o passo manual exato que o humano pode repetir. "Implementado conforme especificado" não é evidência. É opinião.

Antes de declarar a entrega pronta, rode o que o projeto tem de build, teste, lint e checagem de tipo, e cole a saída. Se qualquer um falha, a entrega **não** está pronta — reporte o estado real. Um relatório honesto de falha é infinitamente mais útil do que um verde inventado.

Feche com: ACs atendidos, ACs não atendidos e por quê, o que ficou fora de propósito, e o que o humano precisa testar na mão.

**G4 — Gate de verificação.** O humano aprova ou devolve.

## Quando o usuário quer pular etapa

Vai acontecer: "não precisa de spec, é rápido". Respeite, mas com uma condição — faça o mínimo viável em voz alta antes de codar: o objetivo em uma frase e os critérios de aceite em bullets, na própria conversa, sem criar arquivo. Trinta segundos que evitam construir a coisa errada.

Se durante essa implementação "rápida" aparecerem ambiguidade real, mudança de dado ou impacto em segurança, pare e proponha subir para o ciclo completo.

## Estrutura final

```
specs/
  001-cadastro-de-veiculo/
    spec.md
    plan.md
    tasks.md
    verification.md
  002-registro-de-abastecimento/
    ...
```

Specs são versionadas junto com o código e não são descartadas depois da entrega. Elas são o registro de por que o sistema é como é — o que o `git log` nunca consegue contar.
