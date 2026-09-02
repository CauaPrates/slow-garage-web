# DESIGN.md — Identidade visual do Slow Garage

Decidida na Fase 0 (`specs/000-foundation/`), ancorada na logo real do clube
(`5348.png` — "Slow Car Club" / スロー ガレージ), não na sugestão genérica de
"oficina de garagista" do documento de kickoff. A logo é um adesivo de time
de rua no estilo kanjozoku/street racing japonês: lettering cursivo de
graffiti, subtítulo em katakana, anel de pista, brilho e um pequeno emblema.
O dono da marca escolheu essa direção depois de ver três alternativas — ver
histórico de clarify da Fase 0.

## Tokens de cor

Definidos em `src/styles/tokens.css`. Dark é o padrão absoluto do produto —
não segue `prefers-color-scheme`. A classe `.light` no elemento raiz troca
a paleta inteira via CSS variables; nenhum componente decide cor sozinho.

### Dark (padrão)

| Token | Valor | Papel |
|---|---|---|
| `--color-bg` | `#16140F` | Fundo — preto quente, carroceria sob luz de sódio, sem azul |
| `--color-surface` | `#201C15` | Superfície elevada (card, modal) |
| `--color-border` | `#332D22` | Borda, divisor |
| `--color-text-primary` | `#F5F1E8` | Texto principal — branco giz, como a própria logo |
| `--color-text-secondary` | `#A39A85` | Texto de apoio |
| `--color-accent` | `#D9A441` | Dourado — vinil cromado do adesivo. Único acento de marca |
| `--color-accent-foreground` | `#16140F` | Texto sobre superfície `accent` |
| `--color-success` | `#7FA05C` | Sucesso |
| `--color-error` | `#C1503C` | Erro |
| `--color-warning` | `#CB6B2C` | Alerta — deslocado do dourado para não competir com o acento de marca |

### Light

| Token | Valor |
|---|---|
| `--color-bg` | `#F7F2E8` |
| `--color-surface` | `#FBF7EE` |
| `--color-border` | `#DDD3BE` |
| `--color-text-primary` | `#1E1B15` |
| `--color-text-secondary` | `#6B6252` |
| `--color-accent` | `#A97A1F` (escurecido do dark para manter contraste AA em texto/fundo claro) |
| `--color-accent-foreground` | `#F7F2E8` |
| `--color-success` | `#4F7A3A` |
| `--color-error` | `#9B3C2C` |
| `--color-warning` | `#A3591E` |

## Tipografia

Dois papéis deliberadamente separados — a energia da logo não pode
atrapalhar a leitura de número e data repetidos cem vezes por semana.

| Papel | Fonte | Uso |
|---|---|---|
| Hero | **Permanent Marker** (OFL, self-hosted via `@fontsource`) | Só nos quatro pontos combinados: splash, login, cabeçalho de veículo, estado vazio. **Nenhum desses existe ainda na Fase 0** — a fonte está carregada e pronta, mas não aparece em nenhum componente desta fase (ver RN-3 da spec) |
| Corpo / dado | **Space Grotesk** (OFL, self-hosted) | Todo o resto: shell, formulário, lista, número. Numerais tabulares para alinhamento de coluna |
| Marca (katakana) | **Noto Sans JP** — **adiada**, ver "O que foi recusado" | Pequena etiqueta de marca perto do nome do app, além da logo estática (decisão do clarify) |

## Densidade

Convenção usando a escala padrão do Tailwind (já apoiada em `--spacing`,
portanto já é CSS variable):

- Alvo de toque mínimo: `h-11`/`w-11` (44px) — botão, campo de input, e o
  rótulo que envolve o toggle de tema
- Cabeçalho/barra: `px-4 py-3`
- Conteúdo de tela: `p-6` como ponto de partida
- Formulário (Fase 1 em diante): campos empilhados com `gap-4`, label e
  campo com `gap-1.5`, mensagem de erro logo abaixo do campo que ela
  descreve — nunca um bloco de erro genérico separado do campo
- Card de formulário de auth (`AuthLayout`): `max-w-sm`, `p-6`, `rounded-lg`,
  centralizado vertical e horizontalmente
- Card de item de lista (Fase 2 em diante): foto/placeholder `h-40`,
  corpo `p-4`, grid de dados `gap-2`, ações (editar/excluir) alinhadas à
  direita no rodapé do card
- Par de campo lado a lado no formulário (marca/modelo, ano/km etc.):
  empilha em coluna única abaixo de `sm` (640px) — testado e corrigido
  na Fase 2, texto de `<select>` truncava ("Selecior" em vez de
  "Selecione") em 320px com duas colunas
- Diálogo (`Dialog`/`AlertDialog`): `max-w-md`/`max-w-sm`, `max-h-[85vh]`
  com `overflow-y-auto` — formulário mais longo que a tela rola dentro
  do diálogo, nunca estoura pra fora

## Hierarquia

Número importante ganha peso e tamanho, não cor — o dourado fica reservado
para ação primária, foco e estado ativo, nunca para destacar um valor no
meio de uma lista. Texto secundário (`text-secondary`) carrega metadado
sem competir com o dado principal.

## Onde a ousadia mora

A energia "hero" (Permanent Marker, lettering grande) fica restrita aos
quatro pontos combinados. Todo o resto — cromo do shell, botão, campo —
usa Space Grotesk e é deliberadamente quieto. Regra de interação: confirma,
nunca celebra (nenhuma animação de comemoração; o brilho da logo é um
elemento estático de marca, não uma animação de sucesso).

**Primeira aplicação real (Fase 1)**: `/entrar` e `/cadastro` são os dois
primeiros pontos hero implementados de fato. O wordmark "Slow Garage" em
Permanent Marker fica centralizado acima do card de formulário, sozinho —
nenhum outro elemento da tela usa a fonte hero, nem o cabeçalho (que nem
existe nessas telas: `AuthLayout` não usa o `AppShell`, de propósito, pra
não competir com o wordmark). Card do formulário em `surface`, sem
sombra — só borda de 1px, mantendo o fundo escuro como protagonista atrás
do wordmark.

## Ícones do PWA

Gerados por `scripts/generate-icons.mjs` a partir de `5348.png`, compostos
sobre `#16140F`. Em tamanho grande (192px+) a logo é legível por inteiro;
em favicon (32px) só a forma geral do adesivo é reconhecível, o lettering
não — comportamento esperado para qualquer logo detalhada nesse tamanho,
não é um defeito a corrigir agora.

## O que foi recusado, com o motivo

- **Vermelho como acento principal** — puxaria energia de pista de corrida
  para telas de uso diário (lista, formulário), contrariando o objetivo de
  "confirma, não celebra". O dourado carrega a mesma herança de adesivo
  cromado sem essa competição.
- **`Permanent Marker` fora dos quatro pontos combinados** — ilegível em
  densidade de lista/formulário. Testado e descartado por design, não por
  limitação técnica.
- **Fundo azulado ou verde-ácido** — default de geração automática de UI;
  a logo real não pede isso e o requisito de "dark quente" continua valendo
  mesmo com a mudança de direção para o estilo kanjo.
- **`tailwind.config.ts` (Tailwind v3)** — o plano original previa v3. A
  versão estável no momento da implementação é a v4, que dispensa config
  JS e define tokens direto em CSS via `@theme` — ajuste de "como", não de
  decisão visual. Ver ADR em `docs/DECISIONS.md`.
- **Carregar `@fontsource/noto-sans-jp` (subset japanese) globalmente** —
  mesmo só o subset japonês do peso 400 pesa ~1MB (a fonte cobre milhares
  de kanji; não há subset "só katakana" pronto no pacote). Adiado para a
  fase que efetivamente construir o ponto de marca com katakana (provável
  Fase 1, splash/login): ali a decisão é entre subsetting manual dos ~5
  glifos necessários (ガレージ), carregamento tardio (só quando a tela hero
  monta) ou reaproveitar a própria imagem da logo em vez de texto vivo. O
  token `--font-jp` já existe em `tokens.css`, mas sem fonte carregada —
  cai no fallback de `--font-sans` até essa decisão.
