# Plano 003 — Casca de navegação e rota do veículo

| | |
|---|---|
| **Spec** | ./spec.md |
| **Status** | aprovado |

## 1. Abordagem

Um único arquivo de configuração (`lib/navigation.ts`) declara os itens de
sidebar, bottom nav e folha "Adicionar" com `to: string | null` — `null`
significa "tela ainda não existe, renderizar desabilitado". `Sidebar` e
`BottomNav` leem essa lista e decidem, item a item, entre `NavLink` (quando
`to` existe) e um `<button aria-disabled>` focável (quando não existe). A
rota `/v/:vehicleId` reaproveita o cache de `useVehicles` (Fase 2) via um
novo hook derivado `useVehicle(id)` — sem query nova, sem duplicar fetch. A
folha "Adicionar" usa o primitivo `Dialog` já existente, só com
`className` de posicionamento na base da tela, evitando instalar uma lib de
bottom-sheet.

## 2. Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Instalar `vaul` (biblioteca de bottom sheet) | Uma dependência nova para um comportamento que o `Dialog` (Radix) já cobre com CSS — fere a meta de custo R$0 e a regra de não somar dependência sem necessidade real |
| Ocultar por completo os itens de nav ainda não construídos (3ª opção do clarify) | Esconderia a forma final do produto até a Fase 9; o usuário optou por deixar a navegação completa visível desde já, só desabilitada |
| Nova query `useVehicleById(id)` batendo direto no Supabase | Duplicaria a query já feita por `useVehicles`; o veículo simplesmente não muda entre a lista e a rota de detalhe nesta fase, então filtrar o array já cacheado é suficiente e mais barato |
| Contexto React `SelectedVehicleProvider` para guardar o veículo atual | Contradiz RN-1/seção 6 do doc mestre — veículo selecionado mora na URL, nunca em estado global |
| `<a>`/`NavLink` com `disabled` nativo para itens não construídos | Elemento seria removido da ordem de tab, quebrando AC-9 (item precisa continuar alcançável por teclado, só marcado indisponível) |

## 3. Impacto em contratos e dados

Nenhum. Nenhuma tabela, view, coluna ou RPC nova é lida. `useVehicle(id)`
é uma derivação client-side de uma query que já existe.

## 4. Arquivos

| Arquivo | Ação | Propósito |
|---|---|---|
| `src/lib/routes.ts` | modificar | Adicionar `vehicle: (id: string) => \`/v/${id}\`` ao objeto `ROUTES` |
| `src/lib/navigation.ts` | criar | Fonte única dos itens de sidebar, bottom nav e folha "Adicionar" (label, ícone, rota ou `null`) |
| `src/components/layout/Sidebar.tsx` | criar | Sidebar desktop com os 10 itens, item habilitado vira `NavLink`, desabilitado vira botão `aria-disabled` |
| `src/components/layout/BottomNav.tsx` | criar | Bottom nav mobile (5 itens) + botão "Adicionar" destacado que abre a folha |
| `src/components/layout/AddActionSheet.tsx` | criar | Folha com os 6 tipos de registro rápido, todos desabilitados nesta fase |
| `src/components/layout/AppShell.tsx` | modificar | Compor header existente + `Sidebar` + `Outlet` + `BottomNav` |
| `src/features/vehicle/useVehicles.ts` | modificar | Adicionar `useVehicle(vehicleId)` derivado de `useVehicles()` |
| `src/features/vehicle/VehiclePage.tsx` | criar | Tela `/v/:vehicleId`: loading, não encontrado, erro, sucesso (header + resumo) |
| `src/features/vehicle/VehicleCard.tsx` | modificar | Envolver foto+info em `Link` para `/v/:vehicleId` (AC-1), sem aninhar os botões de ação dentro do link |
| `src/app/router.tsx` | modificar | Rota filha `v/:vehicleId` sob o `AppShell`, apontando para `VehiclePage` |
| `docs/DESIGN.md` | modificar | Documentar o padrão visual de item desabilitado ("Em breve") e a densidade da sidebar/bottom nav/sheet |
| `docs/DECISIONS.md` | modificar | ADR: sheet construída sobre `Dialog` reposicionado, sem lib nova; ADR: convenção de nav desabilitado por fase pendente |

## 5. Ordem de execução

1. `lib/routes.ts` — helper `vehicle(id)` (contrato de rota antes de qualquer consumidor)
2. `lib/navigation.ts` — configuração dos itens (dado antes de interface)
3. `useVehicles.ts` — `useVehicle(id)` (hook antes da tela que o usa)
4. `Sidebar.tsx`, `BottomNav.tsx`, `AddActionSheet.tsx` — chrome de navegação
5. `AppShell.tsx` — compõe o chrome
6. `VehiclePage.tsx` — tela de destino
7. `router.tsx` — liga a rota
8. `VehicleCard.tsx` — liga o ponto de entrada (garagem → veículo)
9. `docs/DESIGN.md`, `docs/DECISIONS.md` — documentação
10. Verificação manual com `ui:check` + navegação real contra o Supabase de dev

## 6. Cobertura dos critérios de aceite

| AC | Como será verificado | Tipo |
|---|---|---|
| AC-1 | Clicar num card em `/` com Playwright/manual, conferir URL e conteúdo de `/v/:id` | manual |
| AC-2 | Veículo sem foto (ex.: um dos seeds sem `primary_photo_id`, ou editar temporariamente) → conferir placeholder | manual |
| AC-3 | Acessar `/v/00000000-0000-0000-0000-000000000000` manualmente → conferir mensagem + link | manual |
| AC-4 | Screenshot desktop (1440px) da sidebar, conferir os 10 itens e o estado de cada um | manual + `ui:check` |
| AC-5 | Screenshot mobile (390px), conferir os 5 itens e estado | manual + `ui:check` |
| AC-6 | Tocar "Adicionar" em 390px, conferir folha com 6 itens desabilitados, fechar por fora/X/Esc | manual |
| AC-7 | Conta com 2+ veículos (ex.: precisa existir ou criar um segundo veículo de teste), trocar pelo seletor, conferir URL e conteúdo mudam | manual |
| AC-8 | Conta com 1 veículo só, conferir seletor sem outra opção | manual |
| AC-9 | Tab pela sidebar/bottom nav/sheet, conferir foco chega nos itens desabilitados e `aria-disabled="true"` no DOM | manual + axe |
| AC-10 | `ui:check` em 320px nas rotas `/` e `/v/:id`, conferir `scrollWidth === innerWidth` e alvo de toque | automático (`ui:check`) |

## 7. Riscos técnicos

| Risco | Impacto | Mitigação |
|---|---|---|
| Item desabilitado ficar indistinguível do habilitado (contraste, estilo) | Usuário tenta clicar e acha que quebrou | Opacidade reduzida + `cursor-not-allowed` + texto "Em breve" sempre visível (nunca só cor) |
| `Dialog` reposicionado como bottom sheet quebrar em 320px com teclado virtual | Folha inutilizável no cenário real de posto | Testar em viewport reduzido (~380px de altura) igual foi feito na Fase 2 para os diálogos |
| `VehicleCard` virar `Link` e quebrar o clique dos botões de Editar/Excluir (aninhamento de interativo) | Botões param de funcionar ou disparam navegação indesejada | Botões de ação ficam **fora** do `Link`, em linha própria, não aninhados — testado manualmente clicando em cada um |
| Precisar de 2º veículo de teste para AC-7/AC-8 e as contas seed terem só 1 cada | Bloquear verificação completa | Usar `alice@dev.local` (1 veículo) para AC-8 e criar um segundo veículo temporário em `bob@dev.local` (ou usar o fluxo de criação já existente da Fase 2) para AC-7, documentando no verification.md |

## 8. Rollback

Toda mudança é aditiva ou de arquivo novo, exceto `AppShell.tsx` e
`VehicleCard.tsx`. Reverter é `git revert` do commit da fase — não há
migration, não há dado gravado, nenhuma mudança de schema ou de storage.

## 9. Definição de pronto

- [ ] Todos os ACs verificados com evidência em `verification.md`
- [ ] Build passa
- [ ] `tsc --noEmit` passa
- [ ] Lint passa
- [ ] `docs/DESIGN.md` e `docs/DECISIONS.md` atualizados
- [ ] `ui:check` rodado em `/` e `/v/:id` nos 4 breakpoints obrigatórios
- [ ] Commit em `feature/003-vehicle-shell` e merge `--no-ff` em `dev`, branch preservada
