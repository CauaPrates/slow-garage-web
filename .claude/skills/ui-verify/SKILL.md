---
name: ui-verify
description: Verificação de interface por execução real, não por leitura de código. Sobe o app, navega o fluxo com Playwright, captura screenshot em 320/390/768/1440px, detecta overflow horizontal, roda axe-core para acessibilidade e captura erro de console. Use SEMPRE antes de declarar que qualquer trabalho de UI está pronto, no gate de verificação do SDD, e quando o usuário perguntar "funciona?", "está pronto?", "testa aí", "confere se quebrou", "vê no mobile", "cabe em tela pequena". Use também quando você estiver a ponto de escrever que uma tela funciona sem ter aberto ela.
---

# ui-verify

Você não consegue ver a interface. Ler o JSX e concluir que a tela funciona é dedução, não verificação — e é o modo de falha mais comum em trabalho de frontend assistido por IA. Código que compila, tipa e passa no lint pode renderizar uma tela quebrada, cortada, ilegível ou com overflow que só aparece em 320px.

Esta skill existe para substituir dedução por evidência.

## Regra

> Nenhuma afirmação sobre comportamento visual sem screenshot ou saída de comando que a prove.

"O card está responsivo" não é afirmação verificada. "Screenshot em 320px anexado, `scrollWidth` igual a `innerWidth`" é.

Se você não pode rodar (ambiente sem browser, app não sobe), **diga isso explicitamente** e liste o que eu preciso conferir na mão. Nunca preencha a lacuna com suposição otimista.

## Setup, uma vez por projeto

```bash
npm i -D playwright @axe-core/playwright
npx playwright install chromium
```

Copie `references/ui-check.mjs` para `scripts/ui-check.mjs` e adicione:

```json
"scripts": { "ui:check": "node scripts/ui-check.mjs" }
```

Screenshots vão para `.ui-check/` — adicione ao `.gitignore`.

## Fluxo

1. **Suba o app.** `npm run dev` em background. Confirme que responde antes de seguir — não presuma a porta
2. **Rode `npm run ui:check`** com as rotas da fase. Ele varre cada rota em cada viewport
3. **Olhe os screenshots.** Você tem visão: use. Abra os arquivos gerados e avalie de verdade — texto cortado, elemento sobreposto, contraste ruim, alinhamento torto, espaçamento inconsistente. Essa é a parte que nenhum assert automatiza
4. **Leia os achados** de overflow, axe e console
5. **Reporte** com os caminhos dos screenshots e a saída literal

## O que o script pega

| Checagem | Como |
|---|---|
| Overflow horizontal | `document.documentElement.scrollWidth > window.innerWidth` — falha dura, nunca aceitável |
| Acessibilidade | axe-core: contraste, label ausente, ordem de heading, role inválido, alvo de toque |
| Erro de runtime | `console.error` e `pageerror` capturados durante a navegação |
| Regressão visual | screenshot por rota × viewport |

Viewports obrigatórios: **320** (piso absoluto), **390** (iPhone comum), **768** (tablet), **1440** (desktop).

## O que o script não pega, e você precisa verificar na mão

* **Teclado virtual aberto.** Formulário em 390px com teclado ocupando metade da tela é o cenário real de registrar abastecimento no posto. Emule reduzindo a altura do viewport para ~380px e olhe se o botão de salvar continua alcançável
* **Fluxo com dado real.** Criar, editar, apagar. Screenshot de tela vazia não prova que a lista renderiza
* **Os quatro estados.** Loading, vazio, erro, sucesso. Force cada um: rota inexistente, tabela vazia, rede offline no DevTools
* **Navegação por teclado.** Tab pela tela inteira, confira foco visível em tudo que é interativo
* **Sensação de uso.** Se a interação parece travada ou a animação incomoda, nenhum assert vai te dizer

## Relatório

```markdown
## Verificação de UI — <fase/rota>

**Rodou:** `npm run ui:check` em <rotas>

| Viewport | Overflow | axe | Console | Screenshot |
|---|---|---|---|---|
| 320px | ✅ | 2 avisos | limpo | `.ui-check/320-gastos.png` |

### Achados do axe
<saída literal, sem resumir>

### Avaliação visual
<o que você viu nos screenshots — problema concreto, não "parece bom">

### Não verificável automaticamente
1. <passo exato para eu conferir>
```

Se qualquer overflow apareceu, ou qualquer violação `serious`/`critical` do axe, a entrega **não** está pronta. Reporte o estado real. Relatório honesto de falha vale mais do que verde inventado que eu descubro falso na primeira vez que uso o app no celular.
