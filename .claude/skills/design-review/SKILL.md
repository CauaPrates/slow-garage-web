---
name: design-review
description: Auditoria de código de interface já construída contra o DESIGN.md do projeto e um piso de qualidade. Checa cor hardcoded fora dos tokens, os quatro estados de tela (loading, vazio, erro, sucesso), alvo de toque, semântica de elemento interativo, duração de animação, texto em português, e uso correto dos helpers de formatação. Use SEMPRE depois de construir ou alterar componente ou tela, antes de fechar uma fase, e quando o usuário pedir "revisa", "confere", "olha se ficou bom", "tá seguindo o design", "revisão de UI", "code review de frontend". NÃO use para decidir a identidade visual ou escolher paleta e tipografia — isso é a skill frontend-design. Esta skill audita o que já existe.
---

# design-review

Auditoria **estática** de UI: você lê o código e aponta o que está fora do padrão. Comportamento em execução — contraste real, overflow, screenshot — é da skill `ui-verify`. As duas se complementam e nenhuma substitui a outra.

Saída obrigatória: lista de achados classificados, cada um com arquivo, linha e a correção concreta. Sem "considere melhorar". Se você não sabe qual é a correção, o achado não está entendido.

Classificação:

* 🔴 **bloqueia a fase** — quebra acessibilidade, quebra o design system, ou entrega tela sem estado tratado
* 🟡 **corrige agora** — inconsistência real, mas sem quebrar nada
* 🟢 **registra** — melhoria que pode esperar; anote e siga

## 1. Tokens — 🔴

Zero cor, raio, sombra ou espaçamento hardcoded em componente. Tudo vem das CSS variables definidas no `DESIGN.md` e consumidas pelo Tailwind.

Varra:

```bash
grep -rnE '#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(' src --include='*.tsx' --include='*.ts'
grep -rnE '\[[0-9]+px\]|text-\[|bg-\[|border-\[' src --include='*.tsx'
```

Exceção legítima: `src/styles/` e a definição dos próprios tokens. Qualquer ocorrência em `features/` ou `components/` é achado.

Classe arbitrária do Tailwind (`w-[347px]`, `bg-[#1a1a1a]`) é o vazamento mais comum. Medida mágica em componente significa que falta um token de espaçamento, ou que o layout está sendo forçado em vez de fluir.

## 2. Os quatro estados — 🔴

Toda tela ou componente que busca dado tem **quatro** estados implementados. Três é o erro clássico — o esquecido é sempre o vazio, e é o que o usuário vê no primeiro dia de uso.

| Estado | Exigência |
|---|---|
| Loading | Skeleton onde o layout é previsível, spinner só onde não é. Sem layout pulando quando o dado chega |
| Vazio | Mensagem **mais ação**. "Nenhum gasto registrado" sozinho é beco sem saída |
| Erro | O que aconteceu, em português, com opção de tentar de novo. Sem stack trace, sem código do Postgres |
| Sucesso | O conteúdo |

Para cada `useQuery` no arquivo, confirme que os quatro existem. `if (isLoading) return <Spinner/>` seguido direto do `.map()` é achado 🔴: lista vazia renderiza nada e a tela parece quebrada.

## 3. Semântica e teclado — 🔴

* `div` ou `span` com `onClick` é achado. Se clica, é `<button>`; se navega, é `<a>` ou `<Link>`. Nada de `role="button"` remendando `div`
* Todo input tem `<label>` real associado. `placeholder` não é label — ele desaparece quando o usuário digita, e leitor de tela ignora
* Foco visível em tudo que é interativo. `outline-none` sem substituto é achado
* Ícone sozinho como ação precisa de `aria-label`
* Toast e erro em região com `aria-live`
* Ordem de heading sem pulo (`h1` → `h3` é achado)

```bash
grep -rn 'onClick' src --include='*.tsx' | grep -E '<(div|span)'
grep -rn 'outline-none' src --include='*.tsx'
```

## 4. Alvo de toque — 🔴 no mobile

Mínimo 44×44px em qualquer coisa tocável. Botão de ícone com `h-8 w-8` (32px) é achado. Vale especialmente para excluir, editar e fechar — ações pequenas e destrutivas encostadas em outras.

Verifique também espaçamento entre alvos adjacentes: dois botões colados de 44px ainda produzem toque errado.

## 5. Animação — 🟡

Nada acima de 200ms em transição de interface. Movimento responde a ação do usuário (abrir, expandir, confirmar) — não roda sozinho na entrada de seção nem em hover de todo card.

Confira `prefers-reduced-motion` respeitado.

```bash
grep -rnE 'duration-(300|500|700|1000)|transition-all' src --include='*.tsx'
```

`transition-all` é achado por si: anima propriedade que você não pretendia e custa performance.

## 6. Idioma — 🔴

Regra do projeto: **código em inglês, interface em português.**

Achado nas duas direções: label em inglês vazando para a tela (`"Save"`, `"Loading..."`, `"No data"`), e nome de variável ou função em português (`function CartaoVeiculo`).

```bash
grep -rnE '>(Save|Cancel|Delete|Edit|Loading|Submit|No data)' src --include='*.tsx'
```

Confira também o tom: mensagem de erro não pede desculpa e não é vaga. Diz o que aconteceu e o que fazer. Botão diz o que acontece — "Salvar gasto", não "Enviar". E a ação mantém o mesmo nome do botão até o toast: "Salvar" produz "Gasto salvo".

## 7. Formatação — 🟡

Dinheiro, data, número e quilometragem sempre pelos helpers de `lib/format.ts`. `toFixed(2)` espalhado, `toLocaleDateString()` inline ou concatenação de `"R$ "` são achados.

```bash
grep -rnE 'toFixed|toLocaleDateString|toLocaleString|R\$ ' src --include='*.tsx' | grep -v 'lib/format'
```

## 8. Duplicação — 🟡

Antes de aprovar componente novo, procure se já existe equivalente. Duplicação em frontend é como o projeto apodrece: dois cards de veículo divergem, um recebe correção, o outro não.

Sinal de alerta: dois arquivos com estrutura de JSX quase idêntica, ou o mesmo bloco de formatação repetido em três telas.

Cuidado com o oposto: componente genérico criado para um único uso é abstração prematura. A regra é esperar o segundo caso real.

## 9. Aderência ao DESIGN.md — 🔴

Leia o `DESIGN.md` e compare. Ele registra a identidade decidida na Fase 0. Achado aqui é qualquer coisa que contradiga a decisão documentada — tipografia fora dos papéis definidos, densidade diferente do resto do app, elemento decorativo que não serve o conceito.

Se o `DESIGN.md` não cobre um caso que apareceu, **pare e pergunte**. Não decida por conta própria e não deixe passar em silêncio: decisão visual tomada no meio da implementação é como a identidade se dissolve.

## Relatório

```markdown
## Design review — <componente/fase>

**Arquivos revisados:** N

### 🔴 Bloqueia
1. `src/features/expenses/ExpenseList.tsx:34` — lista sem estado vazio; `.map()` direto
   após o loading. Correção: bloco de vazio com mensagem e botão de registrar o primeiro.

### 🟡 Corrige
1. ...

### 🟢 Registra
1. ...

**Veredito:** aprovado / aprovado com 🟡 / bloqueado
```

Sem achado é resultado válido — mas só depois de você ter rodado as varreduras. "Revisei e está tudo bem" sem grep é opinião.
