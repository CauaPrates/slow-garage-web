# Verificação 031 — Painel admin, convites e notificações

**Ambiente:** Supabase local do backend `slow-garage` (migration
`20261029230954_create_admin_panel` aplicada, seed com `alice@dev.local`
admin e `bob@dev.local` gearhead), Edge Function `admin-invite` servida com
`supabase functions serve`, **sem SMTP** (de propósito, para o caso
`email_sent: false`). Front no `vite` dev apontando para o Supabase local.
Data: 2026-10-29.

Roteiro em Playwright descartável (dois navegadores, alice e bob logados ao
mesmo tempo, sem reload entre os passos), apagado depois da fase, como nas
fases anteriores.

## Critérios de aceite

Saída literal da última rodada do roteiro:

```
PASS AC-1 — bob: link na sidebar=0, no menu do usuário=0; /admin → http://localhost:5191/ com aviso=1
PASS AC-2 — alice: link=1; série 30d=30 dias e 90d=90; usuários=2; busca "bob" → "bob@dev.local"; filtro admin → "alice@dev.local"
PASS AC-11 — aviso: "Convite criado e notificação enviada, mas o e-mail não saiu: SMTP não configurado (SMTP_HOST/SMTP_FROM)."
PASS AC-9 — detalhe do bob não contém "Chevrolet"/"Opala" (veículo dele); mostra só contagens
PASS AC-3 — contador do bob virou "1 não lidas" 208ms depois do convite, sem reload; botão Aceitar visível
FAIL AC-5 — cancelado → "Convite cancelado.", Aceitar=0; vencido com status='pending' no banco → "Convite expirado." (1x), Aceitar=0; painel filtro Expirado lista 2, sem botão cancelar
PASS AC-4 — após Aceitar: "Ir para o painel" na notificação, "Painel admin" na sidebar sem reload, /admin abriu (http://localhost:5191/admin)
PASS AC-8 — sino="Notificações (3 não lidas)" e banco=3 não lidas; depois de "Marcar todas": sino="Notificações", banco=0
PASS AC-7 (tempo real) — alice em /admin/usuarios foi levada para http://localhost:5191/ com aviso=1; link do painel=0
PASS AC-6 — mensagem: "Não é possível remover o último administrador."; role do bob no banco continua gearhead_admin
PASS AC-2 (log) — log filtrado por role_changed mostra "Sistema / manual" (promoção do seed) e as mudanças via convite e via painel
PASS AC-7 (403) — sem Realtime, alice continuou em http://localhost:5191/admin até clicar "Atualizar"; o 403 not_admin a levou para http://localhost:5191/ com aviso=1

11/12 verificações passaram
```

**Sobre o FAIL do AC-5:** o roteiro esperava exatamente 1 convite no filtro
"Expirado", mas o banco tinha 2, porque o convite vencido de uma rodada
anterior continuava lá. A tela estava certa:

```
$ psql -tAc "select count(*) from public.admin_invites where status='expired' or (status='pending' and expires_at <= now());"
2
```

O comportamento do AC-5 passou: convite cancelado e convite vencido com
`status = 'pending'` no banco não mostram Aceitar/Recusar. O erro era da
expectativa fixa do script.

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | roteiro, linha AC-1 |
| AC-2 | ✅ | linhas AC-2 e AC-2 (log) |
| AC-3 | ✅ | linha AC-3 (208 ms, sem reload) |
| AC-4 | ✅ | linha AC-4 |
| AC-5 | ✅ | linha AC-5 + contagem no banco acima |
| AC-6 | ✅ | linha AC-6 |
| AC-7 | ✅ | linhas AC-7 (tempo real) e AC-7 (403, com o WebSocket do Realtime bloqueado) |
| AC-8 | ✅ | linha AC-8 (sino = banco; zerou) |
| AC-9 | ✅ | linha AC-9; além disso, o painel não faz nenhuma query a tabela de conteúdo, só às RPCs `admin_*` |
| AC-10 | ✅ | build e lint abaixo |
| AC-11 | ✅ | linha AC-11 |
| AC-12 | ✅ | AC-6 mostra a mensagem do `hint` `last_admin`; `errors.ts` nunca lê `message` |

## Interface

7 telas (`/admin`, `/admin/usuarios`, detalhe, `/admin/convites`,
`/admin/auditoria`, `/convites`, popover de notificações) × 320/390/768/1440
× tema escuro e claro, logado como admin:

```
0 combinação(ões) com problema   (escuro)
0 combinação(ões) com problema   (claro)
```

(sem overflow horizontal, zero violação `serious`/`critical` do axe, zero
erro de console). A primeira rodada achou `aria-dialog-name` (serious) no
popover de notificações, corrigido com `aria-labelledby`.

Defeitos vistos nos screenshots e corrigidos: o seletor de período cortava
"Últimos 30 dia" em 320px (virou "30 dias"); "Sistema / manual" ficava
desalinhado na tabela do log.

Registrado, não corrigido: em 320px o nome "GARAGE" do header trunca para
"GA…", porque entrou mais um ícone (notificações). É o truncamento previsto
do header (`min-w-0 truncate`); em 390px cabe inteiro.

### Correção pós-entrega: página inteira rolando no desktop

Reportado pelo usuário com um screenshot: no `/admin` em desktop o header
sumia e sobrava uma faixa vazia embaixo. A verificação acima não pegou
porque só media overflow **horizontal** do documento. No desktop quem rola
é o `<main>`, e o defeito era vertical, no documento.

Causa: elementos `sr-only` (`position: absolute`) sem ancestral
posicionado escapavam do `<main>`. O pior era a tabela de dados do gráfico:
tabela ignora `height: 1px` e cresce até o conteúdo. Medido em 1800×870:

```
antes   30 {"docExtraHeight":660,"docExtraWidth":0,"table":{"top":786,"h":744,"w":170}}
antes   90 {"docExtraHeight":2100,"docExtraWidth":0,"table":{"top":786,"h":2184,"w":170}}
depois  30 {"docExtraHeight":0,"docExtraWidth":0,"table":{"top":786,"h":1,"w":1}}
depois  90 {"docExtraHeight":0,"docExtraWidth":0,"table":{"top":786,"h":1,"w":1}}
```

Correção: a tabela fica dentro de um `div.sr-only`, o `figure` é
`relative`, e o contêiner do `AdminLayout` é `relative` (prende o rótulo
`sr-only` do seletor de período, que sozinho somava 45px em 1024px).
Rechecado: altura e largura do documento sem sobra nas 6 telas, em 1024,
1100, 1280, 1440, 1800 e 1920px (36/36). O check de 320 a 1440px com axe
continua `0 combinação(ões) com problema`. Lint e build: exit 0.

### Correção pós-entrega: painel no mobile

Reportado pelo usuário: no celular não havia caminho visível para o painel
(só o menu do avatar), e as telas estavam feias. Mudanças:

- Configurações ganhou a seção "Administração" (admin: "Painel admin" +
  "Meus convites") ou "Convites" (gearhead: só "Meus convites").
  Configurações é fixo na bottom nav.
- Abas do painel: grade 2×2 abaixo de `sm` (antes cortava "Log de au…").
- Contagens (`StatList`): ficha técnica em lista no mobile, cards do `sm`
  pra cima.
- Detalhe: convites e eventos mostram 5 itens + "Mostrar todos (N)".
- Log no mobile: um card com linhas de 3 linhas curtas. Altura da página
  com 50 eventos em 390px: 5252px → 2508px.
- Links dentro de frase ficam sempre sublinhados (axe
  `link-in-text-block`, achado na primeira rodada).

Rechecado: 8 telas (inclui `/configuracoes`) × 320/390/768/1440 × escuro e
claro → `0 combinação(ões) com problema` nos dois temas. Desktop
1024–1920px sem rolagem extra do documento (36/36). Lint e build: exit 0.

## Build e lint

```
> slow-garage-web@0.0.0 lint
> eslint .

lint exit 0
✓ built in 691ms
precache  123 entries (1408.43 KiB)
build exit 0
```

## Conferir na mão

1. E-mail de convite com SMTP de verdade (Mailpit): aqui a função rodou sem
   SMTP, então só o caminho `email_sent: false` foi exercitado.
2. Navegação por teclado no popover de notificações (Tab por Aceitar,
   Recusar, marcar lida, apagar).
3. Notificação chegando com o celular em segundo plano e voltando ao app.
