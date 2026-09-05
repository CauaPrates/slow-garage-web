# Spec 000 — Fundação do frontend (scaffold, identidade visual, infraestrutura de dados)

| | |
|---|---|
| **Status** | aprovada |
| **Tamanho** | G |
| **Criada em** | 2026-09-01 |
| **Depende de** | — (primeira fase) |

## 1. Problema

O repositório `slow-garage-web` hoje não tem nenhuma base técnica: sem bundler configurado, sem client Supabase tipado, sem convenção de dados, sem identidade visual, sem PWA. Toda fase seguinte (auth, garagem, gastos, abastecimento...) precisa de um chão comum — sem ele, cada fase reinventa configuração de tema, formatação e convenção de cache, e o produto acumula inconsistência entre telas desde o início.

## 2. Resultado esperado

Existe um esqueleto de aplicação que builda, tipa e roda vazio: tema dark/light aplicado com a identidade Slow Car Club (paleta preto-fosco quente + acento dourado, tipografia hero separada da tipografia de corpo), formatação pt-BR centralizada, client Supabase tipado contra o schema real, convenção de query key documentada, layout base sem conteúdo de domínio, e PWA instalável com os ícones da marca. Nenhuma tela de negócio existe ainda — o critério de sucesso é a Fase 1 conseguir começar sem decidir nenhuma questão de infraestrutura de novo.

## 3. Cenários

Esta fase não expõe fluxo de negócio, então não há história de usuário final. O cenário observável é o de quem abre o repositório:

**Principal**
1. Desenvolvedor roda `npm run dev`; o app sobe em uma tela de shell vazia (sem funcionalidade de domínio), com o tema Slow Car Club aplicado e nenhum erro de console.
2. Alguém alterna entre dark e light no shell; a escolha persiste ao recarregar a página.
3. Desenvolvedor roda `npm run types`; o arquivo de tipos é gerado a partir do projeto Supabase informado.

**Alternativos**
- Sem variáveis de ambiente do Supabase configuradas: o app informa claramente que a configuração está ausente, em vez de quebrar com erro genérico ou tela branca.

## 4. Escopo

**Dentro**
- Scaffold Vite + React 19 + TypeScript (`strict: true`)
- Tailwind CSS + shadcn/ui instalados e configurados
- React Router com objeto de rotas tipado (placeholders, sem telas reais)
- Client Supabase tipado (`lib/supabase.ts`) e script `npm run types`
- `.env.example` com chaves vazias; `.env` no `.gitignore` desde o primeiro commit
- Tokens de design (cor, espaçamento, raio, tipografia) como CSS variables consumidas pelo Tailwind, documentados em `docs/DESIGN.md`
- Fontes de licença livre servidas localmente: Permanent Marker (hero), Space Grotesk (corpo/dado), subset de Noto Sans JP (elemento de marca)
- `lib/format.ts`: dinheiro, data, número e decimal com vírgula — pt-BR
- Providers: QueryClient (TanStack Query), tema (dark/light com persistência), convenção de query key documentada
- Shell de layout vazio (sem sidebar/bottom-nav funcionais de domínio)
- PWA base: manifest, ícones em todos os tamanhos derivados da logo Slow Car Club, splash, app shell em cache

**Fora — explicitamente não entra agora**
- Qualquer tela de domínio (login, garagem, gastos etc.) — fases seguintes
- Sidebar desktop e bottom nav mobile funcionais — Fase 3 (`003-vehicle-shell`)
- Autenticação e rotas protegidas — Fase 1 (`001-auth`)
- Validação final de instalabilidade PWA em dispositivo real — Fase 10 (`010-polish`)
- Geração de tipos com dados reais do Supabase — depende de credenciais que ainda não recebi (ver Seção 11); até lá, o script fica pronto e documentado, não executado contra um projeto real

## 5. Critérios de aceite

- **AC-1**: Dado o repositório limpo, quando rodo `npm run dev`, então o app sobe sem erro de console e mostra o shell vazio com o tema Slow Car Club (fundo `#16140F`, acento dourado `#D9A441`) aplicado.
- **AC-2**: Dado o shell aberto, quando alterno para light e recarrego a página, então o tema light persiste e mantém contraste AA em todo texto sobre fundo.
- **AC-3**: Dado o comando `tsc --noEmit`, quando rodo no scaffold completo, então não há erro de tipo.
- **AC-4**: Dado o client de `lib/supabase.ts` tipado com o `Database` gerado, quando uma query de teste referencia uma coluna inexistente, então o erro aparece em tempo de compilação, não em runtime.
- **AC-5**: Dado um valor monetário, uma data e um número decimal passados pelos helpers de `lib/format.ts`, então o resultado aparece como `R$ 1.234,56`, `dd/mm/aaaa` e `12,4` (vírgula) respectivamente — e nenhum outro ponto do código usa `toFixed` ou `toLocaleDateString` inline.
- **AC-6**: Dado o manifest do PWA, quando inspecionado via Lighthouse/DevTools, então o app aparece como instalável, com ícone da logo Slow Car Club em todos os tamanhos exigidos.
- **AC-7**: Dado o app aberto a 320px de largura, quando navego o shell vazio, então não há overflow horizontal.
- **AC-8**: Dado nenhuma variável de ambiente do Supabase configurada, quando o app inicializa, então aparece uma mensagem clara de configuração ausente — nunca tela branca ou erro não tratado no console sem explicação.
- **AC-9 (negativo)**: Dado qualquer componente do shell, quando reviso o CSS, então nenhuma cor está hardcoded fora dos tokens definidos em `docs/DESIGN.md`.
- **AC-10 (negativo)**: Dado o shell renderizado, quando busco por `Permanent Marker` fora dos pontos combinados (splash, login, cabeçalho de veículo, estado vazio), então não há ocorrência — a fonte hero não aparece em texto de corpo ou lista.

## 6. Regras de negócio

- **RN-1**: Nenhuma tela de domínio nasce nesta fase — decisão de escopo, não lacuna de tempo.
- **RN-2**: Todo texto de interface visível nesta fase (mensagens de estado, labels de tema) é em português; nomes de domínio no código permanecem em inglês.
- **RN-3**: A energia visual "hero" (fonte Permanent Marker, lettering grande inspirado na logo) só aparece nos pontos combinados: splash, login, cabeçalho de veículo e estado vazio. Nesta fase isso significa que o shell de layout e qualquer mensagem de estado (ex: "configuração ausente") usam a tipografia de corpo (Space Grotesk), nunca a hero.
- **RN-4**: Tema padrão para usuário novo é dark, independente da preferência do sistema operacional (decisão já tomada).

## 7. Dados

Não há dado de negócio nesta fase. O único "dado" é o resultado da geração de tipos do Supabase (`src/types/database.types.ts`), que é gerado por comando, nunca escrito à mão.

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Preferência de tema (dark/light) | Escolha da pessoa usuária no shell | Não — default dark | Persistida localmente no navegador |

## 8. Estados e transições

N/A — não há entidade de negócio com ciclo de vida nesta fase.

## 9. Erros e casos de borda

- Variáveis de ambiente do Supabase ausentes: mensagem clara na tela, sem quebrar o app.
- Fonte local não carrega (rede lenta ou arquivo corrompido): fallback de sistema definido nos tokens, nunca tela em branco.
- `prefers-reduced-motion` ativo: nenhuma transição além do estritamente necessário; o toggle de tema funciona sem animação.

## 10. Requisitos não-funcionais

- Responsivo de 320px a 1440px+, sem overflow horizontal em nenhum estado.
- Contraste AA no dark e no light para todos os tokens de texto.
- Navegação por teclado funcional no único elemento interativo desta fase (toggle de tema), com foco visível.
- PWA instalável, manifest completo, ícones em todos os tamanhos.
- Sem chamada de rede além do necessário para carregar fontes locais; o client Supabase não busca dado real nesta fase.
- `tsc --noEmit`, build e lint verdes, com saída colada em `verification.md` ao final da fase.

## 11. Dependências e riscos

- **Dependência bloqueante para a Fase 1, não para esta**: `docs/API_CONTRACT.md` ainda não foi recebido. Não impede a Fase 0 (que não referencia tabela, view ou RPC específica), mas preciso do arquivo antes de iniciar o clarify da Fase 1.
- **Dependência para execução completa desta fase**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e o project ref do Supabase de desenvolvimento, para rodar `npm run types` de verdade. Sem isso, o script fica pronto e documentado, mas não executado contra um projeto real, e `database.types.ts` fica com um placeholder explícito até eu receber os valores.
- **Risco**: gerar ícones PWA a partir de um arquivo de contorno branco sobre fundo transparente pode exigir ajuste manual de padding/proporção para ficar correto como ícone maskable no Android. Vou avisar se o resultado não ficar satisfatório com o arquivo já enviado.
- **Risco**: empacotar três famílias de fonte localmente (Permanent Marker, Space Grotesk, subset de Noto Sans JP) aumenta o peso do bundle inicial comparado a um CDN de fontes. Mitigação: subset de caracteres (principalmente no Noto Sans JP, que só precisa dos glifos usados) e `font-display: swap`.

## 12. Perguntas abertas

Nenhuma pergunta pendente. Identidade visual, tema padrão e escopo da fase foram confirmados nas rodadas de clarify anteriores.
