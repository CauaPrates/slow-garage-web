# Spec 014 — Navegação sem clutter, breadcrumb temático, dashboard com identidade, sistema de resposta

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G |
| **Criada em** | 2026-09-04 |
| **Depende de** | Fases 12/13; clarify em chat (skill `frontend-design`) |

## 1. Problema

Depois de ver o produto rodando, o usuário achou a experiência "cara de SaaS genérico" — cor e tipografia já são distintas (ADR-046), mas a composição (todo card com o mesmo tratamento) e a ausência de qualquer resposta visual (nada anima, nada reage) fazem o app parecer um template. Além disso, a navegação mostra opção desabilitada como se fosse clicável (sidebar/bottom-nav/folha "Adicionar" cheios de item cinza "Selecione um veículo" quando não há veículo escolhido) e não existe nenhum jeito de voltar de uma subtela além de sair pela navegação global.

## 2. Resultado esperado

A navegação só mostra o que dá pra clicar agora — sem opção cinza fingindo ser clicável. Toda subtela de veículo tem um breadcrumb temático pra voltar. A home do veículo tem um elemento-assinatura (o odômetro como mostrador de painel) sem repetir a ousadia em todo tile. O app inteiro ganha uma linguagem de resposta consistente e discreta (número que muda pisca uma vez, botão pressionado "cede", alerta entra deslizando) — sempre respeitando `prefers-reduced-motion`.

## 3. Cenários

**Principal**
1. Usuário abre `/` sem veículo selecionado — sidebar/bottom-nav mostram só o que funciona (Minha garagem, Configurações); nada aparece cinza.
2. Usuário abre um veículo e navega pra "Gastos" — vê `Garagem › Opala 76 › Gastos`, clica em "Opala 76" e volta pro dashboard do veículo sem usar a sidebar.
3. Usuário registra um abastecimento pela ação rápida — ao salvar, o tile de "Km atual" pisca uma vez (realce âmbar de 400ms) confirmando que o valor mudou.
4. Usuário clica no botão "Adicionar" (mobile) sem veículo selecionado — o botão aparece desabilitado com motivo, não abre uma folha cheia de opção cinza.

**Alternativos**
- Alerta novo aparece na tela (ex.: depois de um refetch) — entra com slide+fade, não só "pop".
- Usuário com `prefers-reduced-motion` ativo — nenhuma das animações roda; todo estado final (cor, opacidade) aparece direto.

## 4. Escopo

**Dentro**
- `navigation.ts`/`Sidebar.tsx`/`BottomNav.tsx`/`AddActionSheet.tsx`: remove a renderização de item desabilitado — item vehicle-scoped só aparece quando há veículo selecionado; FAB "Adicionar" fica desabilitado (não a folha cheia de item cinza) quando não há veículo. Remove também `to: null`/"not-built" de `NavItem` (código morto confirmado em ADR-046).
- Novo componente `Breadcrumb` (`src/components/layout/Breadcrumb.tsx`), tematizado (separador fino âmbar, não `/`/`>` genérico), adicionado às 8 páginas de subtela de veículo (Gastos, Abastecimentos, Manutenção, Problemas, Projetos, detalhe de Projeto, Histórico, Documentos). `VehiclePage` não ganha breadcrumb próprio (já tem o seletor de veículo).
- `VehicleMetricsRow`: odômetro vira mostrador de arco (SVG, preenche conforme se aproxima do próximo múltiplo de 10.000km — não representa "vida útil", que não tem teto conhecido); custo/km e total investido continuam número em `font-mono`, sem fabricar tendência que o banco não calcula (ver RN-1); total investido ganha um sparkline real dos últimos meses de gasto (`expenses_by_month`, dado que já existe); alertas vira indicador de ponto (pulsa se >0) + texto, não mais tile idêntico aos outros.
- Sistema de resposta: `active:scale-95` em todo `Button` (base, não só primário); entrada animada (`slide+fade`, 200ms) em cada item de `AlertBanner`; realce de 400ms (`useFlashOnChange`, novo hook) nos 3 valores de `VehicleMetricsRow` quando mudam. Tudo com `motion-safe:`/respeita `prefers-reduced-motion`.
- `docs/DESIGN.md`: registra os tokens de motion, o mostrador de odômetro como elemento-assinatura, e o que foi recusado (ver §11).

**Fora** — explicitamente não entra agora
- Sparkline ou "% vs mês anterior" para custo/km — não existe view/coluna com histórico de custo/km no banco; fabricar isso no cliente violaria a regra do projeto de nunca calcular o que o banco não decide. Só "Total investido" ganha sparkline, porque `expenses_by_month` já existe de verdade.
- Reescrever `FinancialSummaryCard`/`FuelSummarySection`/`ActivityCountTiles`/gráficos — continuam com o card "de referência" de sempre, sem hover nem animação (são consulta, não painel ativo — distinção deliberada do sistema de resposta).
- Breadcrumb em telas fora do contexto de veículo (`/configuracoes`, `/`) — só as 8 subtelas listadas.
- Qualquer efeito sonoro, haptic feedback ou animação de "celebração" (confete etc.) — contradiz a regra já estabelecida "confirma, nunca celebra".

## 5. Critérios de aceite

- **AC-1**: Dado `/` sem veículo selecionado, quando a sidebar renderiza, então mostra só "Minha garagem"/"Configurações" — nenhum item cinza/desabilitado aparece.
- **AC-2**: Dado o mesmo cenário no mobile, quando a bottom nav renderiza, então mostra só "Carros"/"Configurações" (sem "Home"/"Dados" cinza) e o botão "Adicionar" aparece desabilitado com `aria-label` explicando o motivo.
- **AC-3**: Dado um veículo selecionado, quando a sidebar/bottom-nav renderizam, então todos os itens aparecem habilitados (comportamento já existente, confirma que não regrediu).
- **AC-4**: Dado qualquer uma das 8 subtelas de veículo, quando a página carrega, então mostra o breadcrumb com "Garagem" (link pra `/`), nome do veículo (link pro dashboard do veículo) e o rótulo da seção atual (sem link, é a página corrente).
- **AC-5**: Dado o detalhe de um projeto, quando o breadcrumb renderiza, então mostra 4 segmentos: Garagem, veículo, Projetos (link), nome do projeto (sem link).
- **AC-6**: Dado o dashboard do veículo, quando `VehicleMetricsRow` renderiza, então o tile de km mostra um mostrador circular (não retângulo simples) com o valor em `font-mono` no centro, e o `aria-label` do mostrador anuncia o valor real por extenso pra leitor de tela.
- **AC-7**: Dado um veículo sem `current_odometer_km`, quando o mostrador renderiza, então mostra "—" no centro e o arco vazio (sem preenchimento) — nunca quebra nem mostra `NaN`.
- **AC-8**: Dado o tile de "Total investido", quando há pelo menos 2 meses em `expenses_by_month`, então mostra um sparkline real desses dados ao lado do valor.
- **AC-9**: Dado o tile de alertas, quando `activeAlertsCount > 0`, então mostra um ponto pulsando (`motion-safe`) ao lado do número — nunca só a cor sem o número.
- **AC-10**: Dado qualquer `Button`, quando pressionado (`:active`), então aplica `scale-95` — comportamento visível em qualquer navegador com CSS `:active` (não depende de JS).
- **AC-11**: Dado um alerta novo em `AlertBanner`, quando monta, então anima entrada (`motion-safe:animate-alert-in`); com `prefers-reduced-motion: reduce`, aparece direto no estado final, sem animação.
- **AC-12**: Dado o valor de km/custo-km/total-investido mudando entre duas renderizações (ex.: depois de salvar um abastecimento), quando o novo valor chega, então o tile correspondente pisca uma vez (`useFlashOnChange`) — no primeiro render (mount), não pisca.

## 6. Regras de negócio

- **RN-1**: Nenhum número exibido é calculado ou estimado no cliente além do que já é uma regra existente (ex.: `odometerKm % 10000` é só uma transformação de exibição de um valor real, não uma estimativa nem uma leitura de outra fonte — RN geral do projeto sobre não inventar dado continua valendo para qualquer *conteúdo*, não para o enquadramento visual de um dado real).
- **RN-2**: Toda animação nova é condicionada a `motion-safe:` (Tailwind já mapeia pra `prefers-reduced-motion: no-preference`) — nenhuma delas pode ser a única forma de comunicar informação (estado final sempre visível sem a animação).

## 7. Dados

Nenhum dado novo — `expenses_by_month` já existe (`useVehicleDashboard`), `current_odometer_km`/`cost_per_km`/`total_invested`/`alerts.length` já existem.

## 8. Estados e transições

N/A.

## 9. Erros e casos de borda

- Veículo sem nenhum mês em `expenses_by_month` (0 ou 1 ponto): tile de "Total investido" não mostra sparkline (não dá pra desenhar tendência com 0-1 ponto) — só o valor, mesmo tratamento de hoje.
- `prefers-reduced-motion: reduce`: nenhuma das animações desta fase roda; todo estado (cor final do flash, posição final do alerta, arco do mostrador) aparece direto, sem transição.

## 10. Requisitos não-funcionais

- Toda animação nova roda em CSS puro (`@keyframes`/`transition`) ou com no máximo um hook (`useFlashOnChange`) — nenhuma biblioteca de animação nova instalada (mesma lógica das fases anteriores: componente feito à mão quando o caso é simples o bastante).

## 11. Dependências e riscos

- Risco: mostrador de arco (SVG) é o primeiro elemento gráfico "decorativo com função" do app (gráficos existentes são dados, não chrome). Mitigado mantendo o valor real em texto (`font-mono`) sempre visível dentro do arco — o arco é reforço visual, nunca a única fonte da informação.
- Risco: remover a renderização de item desabilitado muda o comportamento documentado no ADR-024/046 (repetição de "Selecione um veículo"). Registrado como superseding em `docs/DECISIONS.md` — não é regressão, é a evolução do mesmo princípio (esconder em vez de desabilitar quando a lista de desabilitados é grande o bastante para virar ruído).

## 12. Perguntas abertas

Nenhuma — direção fechada em 3 rodadas de clarify pela skill `frontend-design` antes de escrever esta spec.
