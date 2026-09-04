# Spec 010 — Polimento, acessibilidade, performance e deploy

| | |
|---|---|
| **Status** | implementada |
| **Tamanho** | G — toca todas as telas do app, ainda que sem contrato/dado novo |
| **Criada em** | 2026-09-03 |
| **Depende de** | Fases 0-9 (todas as telas de domínio já existem) |

## 1. Problema

As 10 fases anteriores construíram o produto peça por peça, cada uma verificando só o próprio recorte. Ninguém ainda passou o pente fino no conjunto: existe alguma tela com estado vazio sem texto, algum ponto de acessibilidade que nenhuma fase individual pegou, alguma regressão visual em 320px introduzida por uma fase posterior numa tela de fase anterior, o app nunca foi medido de verdade (Lighthouse), e o app nunca foi publicado — hoje só existe em `localhost`. Esta é a última fase antes do app poder ser usado de verdade fora do ambiente de desenvolvimento.

## 2. Resultado esperado

O app tem uma URL pública, funciona instalado como PWA num celular de verdade, todas as telas têm os três estados (vazio/carregando/erro) com texto real, não há violação de acessibilidade grave pendente, nenhuma tela estoura 320px, e o desempenho foi medido (não só presumido).

## 3. Cenários

**Principal — varredura**
1. Cada rota do app é visitada nos 4 breakpoints (320/390/768/1440), com captura de tela e checagem de overflow horizontal e violações de acessibilidade (axe-core).
2. Toda divergência encontrada (estado faltando, violação `serious`/`critical`, overflow) é corrigida na própria tela, não só documentada.

**Principal — performance**
1. `npm run build` gera o bundle de produção; Lighthouse roda contra o build servido localmente (`vite preview`), não contra o dev server.
2. Pontuação de Performance e a métrica de maior JS inicial são registradas; qualquer coisa facilmente melhorável (code-splitting por rota, por exemplo) é aplicada e reme dida.

**Principal — PWA**
1. Lighthouse roda a categoria PWA contra o build de produção — critério de "instalável" verificado pela ferramenta oficial, não só por inspeção manual do manifest (like a Fase 0 tinha deixado parcial).
2. Manual, pelo humano: instalar o app num celular real e confirmar que abre em modo standalone.

**Principal — deploy**
1. Repositório fica pronto para deploy na Vercel (rewrite de SPA, variáveis de ambiente documentadas) — o próprio deploy (login, conectar o repositório, colar as env vars) é feito pelo humano, por decisão explícita: eu não tenho como autenticar numa conta de terceiro.

## 4. Escopo

**Dentro**
- Varredura de empty/loading/error em toda página de `src/features/*/​*Page.tsx`, corrigindo o que faltar.
- Varredura de acessibilidade (axe-core) em toda rota principal, corrigindo violação `serious`/`critical`.
- Varredura visual 320/390/768/1440px em toda rota principal, corrigindo overflow horizontal.
- Medição de performance via Lighthouse contra o build de produção; code-splitting por rota se a medição justificar.
- Auditoria PWA via Lighthouse; correção do que a ferramenta apontar como não instalável.
- `vercel.json` (rewrite de SPA), `README.md` atualizado (hoje desatualizado — descreve estrutura de pastas e scripts que não existem mais) com instruções reais de deploy.

**Fora** — explicitamente não entra agora
- O deploy em si (clicar em "Deploy" na Vercel, colar env vars) — ação do humano, fora do que posso executar.
- Instalar e testar em dispositivo físico real — ação do humano; eu registro a instrução exata do que testar.
- Qualquer funcionalidade nova — esta fase não adiciona tela, campo ou regra de negócio, só corrige o que já existe.
- Testes automatizados (unitários/integração) — não fazem parte de nenhuma fase deste roadmap; a verificação sempre foi via Playwright real contra o Supabase de dev, mantido aqui.

## 5. Critérios de aceite

- **AC-1**: Dado cada rota principal do app, quando visitada em 320/390/768/1440px, então nenhuma mostra overflow horizontal (`scrollWidth <= innerWidth`).
- **AC-2**: Dado cada rota principal, quando o axe-core roda contra ela, então zero violações de impacto `serious` ou `critical`.
- **AC-3**: Dado qualquer página de listagem/detalhe, quando os três estados (vazio/carregando/erro) são forçados, então cada um mostra texto real em português — nenhum estado em branco silencioso.
- **AC-4**: Dado o build de produção servido localmente, quando o Lighthouse roda a categoria Performance, então a pontuação e a métrica de LCP são registradas em `verification.md` com o número real (não estimado).
- **AC-5**: Dado o build de produção servido localmente, quando o Lighthouse roda a categoria PWA, então o relatório mostra "instalável" (critério automático da própria ferramenta, substituindo a verificação parcial da Fase 0).
- **AC-6**: Dado o repositório, quando alguém segue o `README.md` atualizado, então encontra o comando de build, as duas variáveis de ambiente exigidas, e o passo a passo de deploy na Vercel — tudo batendo com o que existe de verdade no repositório (nenhuma instrução obsoleta).
- **AC-7**: Dado `vercel.json` no repositório, quando o build é importado na Vercel, então uma rota profunda (ex.: `/v/:id/historico`) recarregada direto no navegador não retorna 404 (rewrite de SPA configurado).

## 6. Regras de negócio

N/A — fase de qualidade/infraestrutura, sem regra de negócio nova.

## 7. Dados

N/A — nenhum dado novo. Nenhuma tabela, RPC ou view tocada.

## 8. Estados e transições

N/A.

## 9. Erros e casos de borda

- Violação de acessibilidade encontrada que exigiria mudança de decisão de design já registrada em ADR anterior (ex.: paleta de cor): resolvida com o canal de mitigação já previsto na própria decisão (rótulo direto, ícone+texto), não revertendo a decisão.
- Métrica de performance abaixo do ideal mas sem correção simples e de baixo risco disponível: registrada em `verification.md` como conhecida, não escondida, com o porquê de não ter sido corrigida agora.

## 10. Requisitos não-funcionais

Esta fase inteira É o requisito não-funcional — não há uma seção separada.

## 11. Dependências e riscos

- Risco: "corrigir" uma violação de acessibilidade pode, por engano, desfazer uma decisão visual proposital de fase anterior (ex.: a paleta categórica dos gráficos, que já tem um WARN de contraste conhecido e mitigado — ADR-039). Mitigação: toda correção desta fase é revisada contra `docs/DECISIONS.md` antes de aplicada, pra não contradizer uma decisão já tomada e documentada sem necessidade.
- Risco: Lighthouse contra `localhost` não reflete a rede/CPU reais de um celular no Brasil. Mitigação: reportar o número tal como medido, sem inflar confiança — é a melhor medição possível sem o deploy real.
- Depende de: o deploy real (fora do meu alcance) pra validar performance/PWA em produção de verdade; esta fase mede o que dá pra medir localmente e deixa o resto documentado pro humano conferir pós-deploy.

## 12. Perguntas abertas

Nenhuma — o formato do deploy (eu preparo, humano clica) já foi decidido com o usuário antes desta versão da spec.
