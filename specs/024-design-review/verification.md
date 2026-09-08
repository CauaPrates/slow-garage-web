# Verificação 024 — Revisão de design das fases 020/023

| | |
|---|---|
| **Verificado em** | 2026-09-05 |
| **Resultado** | aprovado |

Fase sem spec própria: é auditoria do que já estava construído, não
feature nova. As decisões duráveis foram pro `docs/DESIGN.md`; aqui fica
só a evidência.

## Achados corrigidos

Todos vieram das varreduras que a revisão de design exige (grep de token,
de semântica, de animação, de idioma, de formatação), não de leitura no
olho. Os três bloqueantes estavam no código que eu mesmo tinha escrito.

| # | Achado | Correção | Evidência medida |
|---|---|---|---|
| 1 | `combobox.tsx`: input de busca com `outline-none` sem substituto de foco | Linha divisória vira âmbar no foco | `borderBottomColor: rgb(151,77,0)` = `--color-accent` |
| 2 | `FipeAssistant.tsx`: "Buscar também o ano" e "Não encontrei meu carro" abaixo do alvo mínimo | `min-h-11` | ambos **44px** a 390px |
| 3 | `VehicleCard.tsx`: "Ver mais" sem `aria-expanded`/`aria-controls` e sem alvo de toque | Padrão WAI-ARIA + `min-h-11` | **44px**; `aria-controls="_r_11_"` resolve pra elemento real; `aria-expanded` false→true |
| 4 | Duas formas pra mesma primitiva: cápsula grossa no "Gasto por categoria" vs. fio reto no "Investimento por veículo", na mesma tela | Trilho reto e fino nos dois | ver abaixo |

`axe` no assistente aberto e no card expandido: **0 violações
(0 serious/critical)**. Sem overflow a 390px. Sem erro de console.

## Unificação do trilho, com dado real

Dois veículos e dois gastos de categorias diferentes criados pela UI só
pra fazer os dois gráficos renderizarem na mesma tela — e apagados
depois.

```
Gasto por categoria : {"barras":2,"altura":"6px","raio":"0px",
                       "cor":"rgb(42, 120, 214)",
                       "trilhoCor":"rgb(211, 208, 200)"}
Investimento/veículo: {"barras":2,"altura":"6px","raio":"0px",
                       "cor":"rgb(151, 77, 0)",
                       "trilhoCor":"rgb(211, 208, 200)"}
--color-border      : #d3d0c8

mesma altura de barra: true (6px vs 6px)
ambas sem raio: true
mesmo trilho: true (rgb(211,208,200) = --color-border)
cor da barra diferente de propósito: true (categórica vs accent)
overflow: 1440 vs 1440 ok
limpeza: apagados ZZG00001 e ZZG00000 · veículos restantes: 0
```

Screenshot `.ui-check/chart-unificado.png`. Isto fecha a limitação
declarada no commit da fase: a mudança tinha sido conferida só
estaticamente, porque a conta de teste não tinha gasto nenhum.

## Achados registrados e **não** corrigidos

| Achado | Por que ficou |
|---|---|
| `VehicleMetricsRow.tsx:57` — `duration-500`, acima dos 200ms da regra | É o mostrador de odômetro, elemento-assinatura documentado na Fase 14, e está sob `motion-safe`. Mexer contrariaria decisão registrada sem pedido |
| `VehicleMetricsRow.tsx:32` — `toLocaleString` fora dos helpers | Está dentro de `aria-label`, não de texto de tela |
| `popover.tsx:20` — `outline-none` no contêiner do Radix | Contêiner que recebe foco programaticamente, não controle. Pré-existente |
| Formatação: 196 arquivos fora do padrão do Prettier | O projeto nunca usou Prettier; adotar agora é um commit que toca quase todo arquivo e atrapalha o `git blame`. Decisão do dono do repo, não minha |
