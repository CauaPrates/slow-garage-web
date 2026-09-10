# Template — spec.md

Copie a estrutura abaixo. Seções que não se aplicam recebem `N/A` com uma linha de justificativa — apagar seção esconde a decisão de não tratá-la.

Marque toda lacuna com `[NEEDS CLARIFICATION: pergunta específica]`. Não entregue spec com marcador pendente.

---

```markdown
# Spec NNN — <título>

| | |
|---|---|
| **Status** | rascunho / aguardando aprovação / aprovada / implementada |
| **Tamanho** | P / M / G |
| **Criada em** | AAAA-MM-DD |
| **Depende de** | specs anteriores, ou — |

## 1. Problema

Que dor existe hoje, para quem, e o que custa deixar como está. Duas a
quatro frases. Se você não conseguir escrever isso sem repetir o título,
o problema não está entendido.

## 2. Resultado esperado

Como fica o mundo depois. Descreva o estado final, não a atividade.

❌ "Implementar tela de cadastro de veículo"
✅ "O usuário consegue registrar um veículo com os dados mínimos em menos
    de um minuto pelo celular, e ele passa a aparecer na garagem"

## 3. Cenários

O caminho principal contado como história, em passos numerados, do ponto
de vista do usuário. Depois, os caminhos alternativos relevantes.

**Principal**
1. ...

**Alternativos**
- ...

## 4. Escopo

**Dentro**
- ...

**Fora** — explicitamente não entra agora, com o motivo
- ...

A lista de fora é a mais importante do documento. É ela que impede o
escopo de crescer durante a implementação.

## 5. Critérios de aceite

Numerados, observáveis, verificáveis por quem não escreveu o código.
Formato Dado/Quando/Então quando ajudar.

- **AC-1**: Dado ..., quando ..., então ...
- **AC-2**: ...

Inclua ACs negativos: o que o sistema deve **recusar** ou **impedir**.

## 6. Regras de negócio

Regras que valem independente de tela ou endpoint. Numere (`RN-1`) para
poder referenciar.

- **RN-1**: ...

## 7. Dados

Que informação nasce, muda ou é lida. Entidades e campos em linguagem de
negócio — sem DDL, sem tipo de banco, sem nome de coluna.

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|

## 8. Estados e transições

Se a entidade tem ciclo de vida, liste os estados e quais transições são
permitidas. Transição não listada é transição proibida.

## 9. Erros e casos de borda

O que acontece quando: dado faltando, valor absurdo, ação repetida,
registro já existente, conexão cai no meio, usuário sem permissão.
Para cada um, o comportamento esperado — não "tratar o erro".

## 10. Requisitos não-funcionais

Só o que for real para esta entrega. Candidatos: comportamento em tela
pequena, tempo de resposta aceitável, quem pode acessar o dado,
acessibilidade, funcionamento offline, volume esperado.

## 11. Dependências e riscos

O que precisa existir antes. O que pode dar errado e o impacto.

## 12. Perguntas abertas

Lista viva. **Precisa estar vazia para a spec ser aprovada.**
```
