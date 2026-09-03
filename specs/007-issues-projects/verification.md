# Verificação 007 — Problemas e projetos

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-03 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ✅ | Veículo sem problema: "Nenhum problema aberto." + "Nenhum problema resolvido ainda." |
| AC-2 | ✅ | Problema "Barulho na suspensão" (título+data): aparece em Abertos com "Aberto" |
| AC-3 | ✅ | Submissão sem título/data: "Informe o título." + "Informe a data do relato.", diálogo permanece aberto |
| AC-4 | ✅ | Mudar status pra "Resolvido": some de Abertos, aparece em Resolvidos |
| AC-5 | ✅ | Exclusão de problema: `issues` cai de 1 para 0 linhas (consulta direta); exclusão de projeto documentada no achado abaixo |
| AC-6 | ✅ | Veículo sem projeto: "Nenhum projeto ainda." + botão "Criar meu primeiro projeto" |
| AC-7 | ✅ | Projeto "Som novo" (só nome): aparece na lista ("Sem item ainda"); no detalhe, progresso mostra "—" pros dois blocos, nunca "0%" |
| AC-8 | ✅ | 2 itens (1 "Instalado", 1 "Lista de desejos"): tela mostra "1 de 2 (50%)"; consulta direta a `project_progress` confirma `pct_items_completed: 50` — valores idênticos |
| AC-9 | ✅ | Itens "Alto-falantes" e "Subwoofer" aparecem na lista do projeto após adicionados |
| AC-10 | ✅ | Item sem nome: "Informe o nome.", diálogo permanece aberto |
| AC-11 | ✅ | Com projeto existente, "Adicionar" → "Upgrade": formulário abre com seletor de projeto habilitado; item "Cabo de força" criado aparece vinculado ao projeto certo (confirmado por consulta direta) |
| AC-12 | ✅ | Sem projeto nenhum, "Adicionar" → "Upgrade": mensagem 'Crie um projeto primeiro para usar o atalho "Upgrade".' com botão "Criar projeto" |
| AC-13 | ✅ | Fora do veículo, folha "Adicionar": "Upgrade" com nome acessível "Upgrade — Selecione um veículo" |
| AC-14 | ✅ | Sidebar "Problemas" e "Projetos" navegam para `/v/:id/problemas` e `/v/:id/projetos` dentro do contexto do veículo |
| AC-15 | ✅ | `/v/:id/projetos/00000000-...`: "Projeto não encontrado." + link "Voltar para projetos" |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Achados durante a verificação

**Comportamento real confirmado, não só suposto**: o texto de
confirmação de "Excluir projeto" já afirmava que os itens também
seriam apagados, mas isso nunca tinha sido testado contra o banco real
(diferente da manutenção, `project_items.project_id` é obrigatório,
então só restava saber se o banco usa `CASCADE` ou `RESTRICT`). Testado
nesta verificação: projeto com 2 itens excluído com sucesso, e os 2
itens desapareceram junto (`project_items` para esse `project_id`
voltou a 0 linhas). Confirma que o texto do diálogo estava certo — é
`CASCADE`. Registrado como ADR-033.

Nenhum bug de aplicação encontrado.

## Saída dos comandos

### Build (`tsc -b && vite build`)
```
✓ 3014 modules transformed.
dist/assets/index-Bb-Dl5gT.css                                 23.89 kB │ gzip:  5.42 kB
dist/assets/index-B7kMBpKH.js                                 179.82 kB │ gzip: 56.96 kB
dist/assets/dist-CUsigxWL.js                                  194.86 kB │ gzip: 62.24 kB
dist/assets/providers-BsTbEvWP.js                             238.27 kB │ gzip: 62.83 kB
dist/assets/router-D39E1qhh.js                                365.08 kB │ gzip: 95.24 kB

✓ built in 8.19s

PWA v1.3.0
mode      generateSW
precache  24 entries (1078.63 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

### Lint (`eslint .`)
```
> slow-garage-web@0.0.0 lint
> eslint .

(saída vazia — sem erro)
```

Uma linha precisou de `eslint-disable-next-line
react-hooks/set-state-in-effect` em `ProjectsPage.tsx`, com
justificativa no comentário: a decisão de abrir o formulário de item ou
mostrar o aviso "crie um projeto primeiro" depende do resultado
assíncrono da query de projetos — não dá pra resolver com estado
inicial preguiçoso como as outras páginas fazem para `?novo=1`.

### Verificação funcional (script Playwright descartável, autenticado contra o Supabase de dev real)
```
  ok  setup: veículo temporário criado
  ok  AC-14: sidebar 'Problemas' navega certo
  ok  AC-1: 2 seções de Problemas com estado vazio próprio
  ok  AC-3: problema sem título e sem data é recusado
  ok  AC-2: problema aparece em Abertos com status Aberto
  ok  AC-4: problema resolvido sai de Abertos
  ok  AC-4: problema resolvido aparece em Resolvidos
  ok  AC-5: exclusão de problema remove do banco
  ok  AC-13: fora do veículo, 'Upgrade' desabilitado com motivo certo
  ok  AC-11 (setup): dentro do veículo, 'Upgrade' na folha é um link habilitado
  ok  AC-12: 'Upgrade' sem projeto nenhum mostra aviso com atalho
  ok  AC-14: sidebar 'Projetos' navega certo
  ok  AC-6: estado vazio de Projetos com ação de criar
  ok  AC-7: projeto aparece na lista
  ok  AC-7: progresso do projeto sem item mostra '—', não '0%'
  ok  AC-10: item sem nome é recusado
  ok  AC-9: itens aparecem na lista do projeto
  ok  AC-8: progresso de conclusão na tela bate com project_progress
  ok  AC-15: projeto inexistente mostra 'não encontrado' + link de volta
  ok  AC-11: 'Upgrade' com projeto existente abre formulário com seletor habilitado
  ok  AC-11: item criado pelo atalho 'Upgrade' está no projeto certo
  ok  AC-5: excluir projeto com itens — comportamento real observado
  ok  desktop: console sem erro
  ok  axe desktop sem violação serious/critical
  ok  320px: sem overflow horizontal em /v/:id/problemas
  ok  320px: sem overflow horizontal em /v/:id/projetos
  ok  limpeza: veículo temporário removido
  ok  limpeza: nenhum problema/projeto/item remanescente do veículo temporário

28/28 checagens passaram.
```

axe-core (`wcag2a`/`wcag2aa`) sem violação `serious`/`critical`.
Screenshots revisados visualmente em 320px e 1440px (lista de
problemas, detalhe de projeto com progresso e itens, folha "Upgrade")
— sem overflow, sem texto cortado, densidade consistente com
`DESIGN.md`.

## Pendências

Nenhuma.

## Para o humano testar na mão

1. Criar um problema de verdade, acompanhar por alguns dias mudando o
   status conforme a investigação avança.
2. Criar um projeto real com orçamento definido e itens com custo
   estimado/real variados, conferir se "Orçamento usado" bate com a
   expectativa.
3. Testar o atalho "Upgrade" com 2+ projetos simultâneos (ex.: som e
   suspensão em andamento ao mesmo tempo) — confirmar que o seletor
   deixa claro qual projeto está recebendo o item.
