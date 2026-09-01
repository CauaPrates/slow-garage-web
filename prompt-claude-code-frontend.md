# PROMPT — SLOW GARAGE · FRONTEND (`slow-garage-web`)

> Cole este arquivo inteiro como primeira mensagem no Claude Code, dentro da pasta do repositório de frontend.

---

## 0. Processo obrigatório — leia antes de tudo

Este projeto é desenvolvido por **SDD (Spec-Driven Development)**. A skill `sdd` está instalada em `.claude/skills/sdd/`.

**Carregue a skill `sdd` agora, antes de ler o resto deste documento.** Ela define o processo; este documento define o conteúdo. Onde houver conflito de processo, a skill vence.

Nenhum componente, nenhuma rota e nenhuma dependência nasce sem passar pelo ciclo:

```
CLARIFY → SPEC ─G1─▶ PLAN ─G2─▶ TASKS ─G3─▶ IMPLEMENT ─G4─▶ VERIFY
```

* **Cada fase da seção 11 é um ciclo SDD completo**, com sua pasta `specs/NNN-slug/`
* A seção 11 diz *o que* cada fase entrega. A skill diz *como* chegar lá
* Gates são gates: em G1, G2, G3 e G4 você **para e espera meu OK**
* **Você não tem permissão para inventar requisito.** Marque `[NEEDS CLARIFICATION]` e pergunte. Isso vale em dobro para decisão visual: não escolha paleta, tipografia ou densidade por conta própria
* **Nunca declare que algo funciona sem evidência literal.** Build, testes, checagem de tipo — cole a saída. Para comportamento visual, diga o que você não pode verificar e me passe o passo exato para eu conferir

No frontend existe uma tentação extra: a tela "parece pronta" no código e você declara vitória sem nunca ter rodado. Não faça isso. Se você não abriu, você não sabe.

---

## 1. Seu papel

Você é o engenheiro responsável **exclusivamente pelo frontend** do Slow Garage: um Web App/PWA de controle de veículos.

> **Seu carro. Sua história. Tudo em um lugar.**

O backend já está **completo e congelado**: repositório `slow-garage` (Supabase — PostgreSQL, Auth, Storage, RLS), 16 tabelas, 25 objetos de schema, 8 funções, 137 testes pgTAP verdes.

**Você não escreve SQL. Você não cria migration. Você não altera schema, policy, view, função ou bucket.** Se algo no backend estiver faltando ou errado, você **para e me reporta** — a correção acontece no outro repositório, por outra sessão, com o ciclo SDD dele.

---

## 2. Escopo do repositório

```
specs/                      # um ciclo SDD por fase
public/
  manifest.webmanifest
  icons/
src/
  main.tsx
  app/
    router.tsx
    providers.tsx            # QueryClient, tema, auth
  features/                  # organização por domínio, não por tipo de arquivo
    auth/
    garage/
    vehicle/
    expenses/
    fuel/
    maintenance/
    issues/
    projects/
    documents/
    dashboard/
  components/
    ui/                      # shadcn — não editar à mão sem motivo
    layout/
    shared/
  lib/
    supabase.ts              # client tipado
    format.ts                # dinheiro, data, número — pt-BR
    utils.ts
  types/
    database.types.ts        # GERADO — nunca editar à mão
  hooks/
  styles/
docs/
  API_CONTRACT.md            # cópia de referência do backend — somente leitura
  DESIGN.md                  # identidade visual decidida na Fase 0
  DECISIONS.md               # ADRs curtos
```

Cada feature guarda o que é dela: componentes, hooks, schemas de formulário, tipos derivados. Só sobe para `components/shared/` o que **já** é usado por duas features. Não antecipe reuso.

---

## 3. Stack e restrições

* React 19 + TypeScript (`strict: true`, sem `any` sem comentário justificando) + Vite
* Tailwind CSS + shadcn/ui + Lucide Icons
* `@supabase/supabase-js` — comunicação direta com o Supabase, **sem camada de API própria**
* TanStack Query para todo dado que vem do servidor
* React Router para roteamento
* `react-hook-form` + `zod` para formulários
* Recharts para gráficos
* `date-fns` com locale `pt-BR`
* `vite-plugin-pwa` para o PWA
* Deploy na Vercel
* Custo alvo **R$ 0**. Sem serviço pago, sem API externa, sem fonte comercial

Nada além disso sem me pedir. Toda dependência nova precisa de justificativa de uma linha em `DECISIONS.md` e do meu OK. Especificamente **não** quero: biblioteca de estado global (Redux, MobX, Jotai), biblioteca de componentes concorrente da shadcn, wrapper de fetch, biblioteca de máscara de input pesada, i18n.

### 3.1 Ambiente

* Projeto Supabase de **desenvolvimento** já existe, com o schema aplicado
* Variáveis: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Peça os valores quando precisar, e crie `.env.example` com as chaves vazias
* **A chave `service_role` nunca entra neste repositório.** Nem em `.env`, nem em teste, nem comentada. Se você sentir necessidade dela, o desenho está errado — pare e me diga
* `.env` no `.gitignore` desde o primeiro commit

### 3.2 Contrato com o backend

`docs/API_CONTRACT.md` é a fonte da verdade. Leia antes de cada fase. `src/types/database.types.ts` é gerado — nunca editado à mão:

```bash
npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
```

Deixe isso como script `npm run types`.

O client precisa ser tipado com o `Database` gerado, para que erro de coluna apareça em tempo de compilação.

**Três regras que o backend depende de você cumprir:**

1. **Nunca recalcule campo calculado pelo banco.** `price_per_liter`, `km_per_liter`, `cost_per_km`, status de manutenção, progresso de projeto, saldo de financiamento, totais — tudo vem pronto de view ou RPC. Se você calcular no cliente, os números vão divergir e ninguém vai saber qual está certo
2. **Não some `fuel_logs` dentro de `expenses`.** Abastecimento não é duplicado em gastos por decisão de arquitetura. O total do veículo vem da view de resumo financeiro, não de soma no cliente
3. **Upload de arquivo segue exatamente o path `{user_id}/{vehicle_id}/{uuid}.{ext}`.** As policies de storage extraem o `user_id` do primeiro segmento. Errar o path = upload rejeitado. Arquivo é lido por signed URL, nunca por URL pública

Prefira uma chamada de RPC a dez de tabela. A dashboard tem `get_vehicle_dashboard`, a busca tem `search_vehicle` — use.

### 3.3 Fronteira de responsabilidade

Você **não** mexe em: schema, RLS, policy, migration, bucket, função Postgres, configuração de Auth no dashboard, Site URL, redirect URL, SMTP.

Se uma fase depender de algo assim, **pare** e me diga exatamente o que falta e onde. Não contorne no cliente. Especialmente: se você descobrir que precisa de dado que o RLS não devolve, isso é conversa de backend, não de workaround.

---

## 4. Regras de trabalho

0. Todo trabalho passa pela skill `sdd`. As regras abaixo são complementos deste frontend.
1. Uma fase por vez, na ordem da seção 11.
2. Antes de cada fase: leia o `API_CONTRACT.md`, o código existente e as specs anteriores. Rode triagem e clarify.
3. Ao final de cada fase: `verification.md` com build, `tsc --noEmit` e lint verdes, saída colada, mais a lista do que eu preciso testar na mão.
4. **Não duplique.** Antes de criar componente, hook, helper de formatação ou schema zod, procure se já existe. Duplicação em frontend é como o projeto morre.
5. Não crie abstração para um caso de uso. Espere o segundo.
6. Se identificar solução melhor do que a que descrevi, **proponha antes** e registre em `DECISIONS.md`.
7. Rode o app e navegue de verdade antes de dizer que a fase acabou.

---

## 5. Convenções de código

* Componentes em `PascalCase.tsx`, hooks em `useCamelCase.ts`, helpers em `camelCase.ts`
* Componente de função com `export function`, não `export default` (exceto onde o Router exigir)
* Props tipadas com `type`, não `interface`, salvo necessidade de extensão
* Sem `React.FC`
* Um componente por arquivo, exceto subcomponente privado usado só ali
* Nomes de domínio em **inglês** no código (`vehicle`, `fuelLog`, `expense`) para casar com o schema. **Todo texto de interface em português.** Não misture: `function VehicleCard()` com label `"Meu veículo"`
* Sem string solta de rota — centralize em um objeto de rotas tipado
* Data e dinheiro sempre pelos helpers de `lib/format.ts`. Nunca `toFixed` espalhado, nunca `new Date().toLocaleDateString()` inline

---

## 6. Arquitetura

### Estado e dados

**TanStack Query é a camada de dados. Não existe estado global de servidor além dele.** Sem contexto próprio duplicando cache, sem `useEffect` buscando dado.

Query keys hierárquicas e previsíveis: `['vehicle', vehicleId, 'expenses', filtros]`. Documente a convenção na Fase 0 e siga.

Toda mutação invalida o que precisa e nada além disso. Onde a espera atrapalha a percepção de velocidade — registrar gasto, registrar abastecimento — use update otimista com rollback em erro.

### Veículo selecionado mora na URL

`/v/:vehicleId/gastos`, `/v/:vehicleId/abastecimentos`. **Não** em contexto, não em localStorage. Motivo: link compartilhável, botão voltar funcionando, refresh preservando onde você estava, e zero risco de estado global dessincronizado.

Estado de UI local (modal aberto, aba ativa, filtro) fica em `useState` ou em query param quando fizer sentido persistir.

### Formulários

`react-hook-form` + `zod`. O schema zod espelha as constraints do banco — se a coluna é `not null`, o campo é obrigatório; se tem `check (>= 0)`, o zod também. Divergência aqui produz erro do Postgres chegando cru na cara do usuário.

Erro de mutação sempre vira mensagem em português compreensível. `duplicate key value violates unique constraint` não é mensagem de usuário.

### Estados de tela

Toda tela que busca dado tem quatro estados implementados, não três: **loading, vazio, erro, sucesso**. Empty state com ação — "Nenhum gasto registrado" mais o botão de registrar o primeiro. Erro com opção de tentar de novo.

Loading: skeleton onde o layout é previsível, spinner só onde não é. Nunca layout pulando quando o dado chega.

---

## 7. Identidade visual

O produto se chama **Slow Garage**. O nome não é acidente e deve guiar o desenho.

"Slow" aponta para o oposto de hype: cuidado, permanência, prazer no processo, trabalho feito com calma. Isso é bem diferente da estética que um app de carro normalmente adota — neon, gradiente agressivo, vibe corrida, sensação de painel de videogame.

Direção sugerida: **oficina de garagista, não pista de corrida.** Dark-first, mas dark quente, não azulado. Tipografia com personalidade no display e neutra no corpo. Espaçamento generoso. Detalhe metálico, textura discreta. Microinteração que confirma, nunca que celebra.

**Isso é sugestão, não decisão.** A identidade é sua e precisa ser resolvida na Fase 0, com pergunta explícita antes de você escrever um token. O que eu não quero: aparência de sistema administrativo, e o dark-mode-genérico-de-template que todo dashboard tem.

Requisitos firmes, independente da direção escolhida:

* Dark-first, com light mode funcionando de verdade — não como afterthought
* Tokens de cor, espaçamento, raio e tipografia como CSS variables, consumidos pelo Tailwind. Zero cor hardcoded em componente
* Fonte de licença livre, servida localmente (sem Google Fonts CDN — privacidade e uma requisição de rede a menos)
* Animação curta e discreta. Nada acima de 200ms em transição de interface
* `DESIGN.md` documentando a decisão com os tokens finais, escrito na Fase 0 e mantido

---

## 8. Navegação

### Desktop — sidebar

Dashboard · Minha garagem · Gastos · Abastecimentos · Manutenção · Problemas · Projetos · Histórico · Documentos · Configurações

### Mobile — bottom navigation, 5 itens

Home · Carros · **Adicionar** · Dados · Configurações

O **Adicionar** é visualmente destacado — é o coração do produto no celular. Ao tocar, abre folha com: Gasto · Abastecimento · Manutenção · Upgrade · Foto · Nota.

**Mobile não é desktop reduzido.** O celular existe para registrar em pé, no posto, com uma mão, em trinta segundos. O desktop existe para analisar sentado. Onde o desenho ideal divergir, divirja — inclusive em quantidade de campo visível, ordem de campo e densidade.

Meta concreta para o registro rápido: **abastecimento em menos de 30 segundos, com no máximo 4 campos obrigatórios visíveis**. O resto colapsado atrás de "mais detalhes". Campo opcional que parece obrigatório é campo que mata a velocidade.

---

## 9. PWA, responsividade e acessibilidade

**PWA:** instalável, manifest completo, ícones em todos os tamanhos, splash, app shell em cache. **Sem fila de escrita offline na V1** — se cair a conexão, informe com clareza em vez de fingir que salvou. Sincronização offline é um problema grande e entra depois, se entrar.

**Responsividade:** funcionar de 320px a 1440px+. Sem overflow horizontal em nenhuma tela, nunca. Modal e formulário utilizáveis em tela pequena e com teclado virtual aberto — teste 375px e 390px explicitamente. Tabela larga vira card ou lista no mobile, não scroll horizontal.

**Acessibilidade:** navegação por teclado em tudo que é interativo, foco visível, contraste AA no dark e no light, label real em todo input, `aria-live` em toast e erro, alvo de toque mínimo de 44px. Nada de `div` com `onClick` fazendo papel de botão.

---

## 10. Formatação pt-BR

Dinheiro em `R$ 1.234,56` com `Intl.NumberFormat('pt-BR')`. Data em `dd/mm/aaaa` na leitura, date picker nativo ou acessível na escrita. Decimal com vírgula na entrada e no display — o usuário vai digitar `45,7` litros, não `45.7`, e isso precisa funcionar. Quilometragem com separador de milhar. Consumo como `12,4 km/L`.

Centralize tudo em `lib/format.ts` na Fase 0.

---

## 11. Fases de entrega

Cada fase é um ciclo SDD completo com sua pasta em `specs/`. A tabela é o escopo pretendido — insumo para a spec, não substituto dela.

| Fase | Pasta | Entrega |
|---|---|---|
| **0** | `000-foundation/` | Vite + TS strict + Tailwind + shadcn + Router. Client Supabase tipado, tipos gerados, `.env.example`. **Decisão de identidade visual + tokens + `DESIGN.md`.** `lib/format.ts`. Providers, convenção de query keys, shell de layout vazio, tema dark/light com persistência, base do PWA. Nenhuma tela de domínio |
| **1** | `001-auth/` | Cadastro, login, logout, recuperação de senha, rotas protegidas, sessão persistida, perfil básico. Tratamento de erro de auth em português |
| **2** | `002-garage/` | "Minha Garagem": listar, criar, editar, excluir veículo. Card com foto, marca, modelo, ano, versão, km, total investido, status. Upload de foto principal seguindo o path do storage |
| **3** | `003-vehicle-shell/` | Rota `/v/:vehicleId`, sidebar desktop, bottom nav mobile, folha do botão Adicionar, troca de veículo, header do veículo |
| **4** | `004-expenses/` | Registro rápido de gasto, lista com filtro por categoria e período, edição, exclusão, categorias do sistema, anexo |
| **5** | `005-fuel/` | Registro de abastecimento otimizado para velocidade, lista, métricas de consumo vindas das views (média, melhor, pior, custo/km) |
| **6** | `006-maintenance/` | Plano preventivo, registro de execução, separação histórico / próximas / vencidas, status vindo da view, alertas internos |
| **7** | `007-issues-projects/` | Problemas com ciclo de status. Projetos com itens, orçamento, progresso financeiro e de conclusão vindos da view |
| **8** | `008-files/` | Documentos, obrigações (seguro, IPVA, licenciamento) com vencimento, financiamento, galeria de fotos por categoria. Signed URLs |
| **9** | `009-timeline-dashboard/` | Timeline unificada com filtro por tipo e período. Dashboard com `get_vehicle_dashboard`, gráficos de gasto por mês e por categoria. Busca com `search_vehicle` |
| **10** | `010-polish/` | Varredura de empty/loading/error em todas as telas, acessibilidade, 320px, performance, PWA instalável validado, deploy na Vercel |

Os critérios de aceite devem ser comportamento observável — "o usuário registra um abastecimento em menos de 30 segundos com 4 campos", "a lista de gastos vazia mostra ação para criar o primeiro". **"Criar o componente X" é tarefa, não critério de aceite.**

---

## 12. Fora de escopo

IA de qualquer tipo, OCR, análise de foto ou documento, push notification, WhatsApp, marketplace, integração com oficina, posto, banco ou seguradora, comunidade, rede social, ranking, app nativo, escrita offline, multi-usuário por veículo, compartilhamento de garagem, monetização, i18n, simulador financeiro.

A arquitetura deve **permitir** isso depois. Nenhuma linha entra agora.

---

## 13. Critério de sucesso da V1

O sistema substitui na prática a planilha de controle do carro. Concretamente: cadastrar o veículo, registrar gasto e abastecimento em segundos pelo celular, acompanhar consumo, planejar manutenção, controlar projetos, consultar a timeline completa, guardar documento e foto, entender quanto já foi gasto — tudo confortável no celular e no desktop.

Se registrar um abastecimento no celular for chato, a V1 falhou, por mais completa que esteja.

---

## 14. Comece agora

Não escreva código. Não instale nada. Nesta ordem:

1. **Carregue a skill `sdd`** e confirme
2. Leia este documento inteiro e o `docs/API_CONTRACT.md`
3. Liste em até 10 bullets onde discorda ou vê risco nas decisões de arquitetura
4. Rode o **clarify** da Fase 0 — em blocos, no máximo 3 perguntas por rodada. A identidade visual é o bloco mais importante e precisa das minhas respostas, não das suas suposições
5. Só depois: `specs/000-foundation/spec.md` e pare no G1
