# Spec 002 — Minha Garagem (CRUD de veículo)

| | |
|---|---|
| **Status** | aprovada |
| **Tamanho** | G |
| **Criada em** | 2026-09-02 |
| **Depende de** | 001-auth |

## 1. Problema

Depois da Fase 1, uma pessoa consegue entrar no app, mas não existe
nenhuma tela de domínio — a Home é um placeholder. Sem veículo
cadastrado, nenhuma fase seguinte (gastos, abastecimento, manutenção)
tem a quem se referir: veículo é a entidade raiz de todo o resto do
produto.

## 2. Resultado esperado

Uma pessoa autenticada cadastra um veículo com os dados essenciais em
menos de um minuto, vê todos os seus veículos numa lista ("Minha
Garagem") com foto, marca, modelo, ano, versão, km, total investido e
status, edita qualquer campo depois — incluindo foto e os detalhes
opcionais que não apareceram na criação — e exclui um veículo com
confirmação clara.

## 3. Cenários

**Principal**
1. Usuário autenticado abre a Home (`/`, protegida) — vira "Minha
   Garagem", substituindo o placeholder da Fase 0.
2. Garagem vazia: estado vazio com ação "Cadastrar meu primeiro
   veículo".
3. Usuário preenche marca, modelo, ano, km atual, combustível, câmbio,
   data e valor de compra, salva.
4. Veículo aparece na lista sem foto (placeholder visual), status
   "Ativo" por padrão, total investido igual ao valor de compra.
5. Usuário abre o veículo, edita: adiciona foto principal e preenche
   cor, placa, motor, potência, torque, valor estimado atual e notas.
6. Card atualiza com a foto e os dados novos.
7. Usuário exclui um veículo, confirma a ação, veículo some da lista.

**Alternativos**
- Falta campo obrigatório no cadastro → formulário recusa antes de
  chamar o servidor, indica o campo.
- Km atual ou valor de compra negativo → recusado.
- Falha no upload de foto → veículo continua existindo do jeito que
  estava, mensagem de erro clara, pode tentar de novo sem perder o
  resto dos dados já salvos.
- Lista não carrega (erro de rede) → estado de erro com "tentar de
  novo", não tela em branco.

## 4. Escopo

**Dentro**
- Listar veículos do usuário — rota `/`, substitui o placeholder
- Criar veículo — campos obrigatórios visíveis; opcionais (cor, placa,
  motor, cilindrada, potência, torque, valor estimado atual, notas)
  atrás de "mais detalhes" (decisão do clarify)
- Editar veículo — todos os campos, incluindo `status`
- Excluir veículo — com confirmação explícita
- Upload/troca da foto principal — opcional na criação, disponível a
  qualquer momento na edição (decisão do clarify)
- Card: foto (ou placeholder), marca, modelo, ano, versão (`trim`), km,
  total investido, status
- Estados de loading/vazio/erro/sucesso na lista

**Fora — explicitamente não entra agora**
- Múltiplas fotos por veículo / galeria — Fase 8 (`008-files`)
- Qualquer tela além do CRUD de veículo (gastos, abastecimento etc.) —
  fases seguintes
- Timeline, dashboard financeiro completo, alertas — Fases 6, 8, 9
- Marcar `archived_at` automaticamente ao mudar `status` pra "vendido"
  — o contrato já diz que isso não é automático; se um dia for
  desejado, é decisão de UX separada. Nesta fase só `status` é
  editável, `archived_at` fica de fora do formulário

## 5. Critérios de aceite

- **AC-1**: Dado nenhum veículo cadastrado, quando a pessoa abre a
  Home, então vê o estado vazio com a ação de cadastrar o primeiro
  veículo.
- **AC-2**: Dado marca, modelo, ano, km atual, combustível, câmbio,
  data e valor de compra preenchidos, quando salva, então o veículo é
  criado com `status = active` e aparece na lista.
- **AC-3 (negativo)**: Dado um campo obrigatório vazio, quando tenta
  salvar, então o formulário recusa antes de chamar o servidor,
  indicando o campo.
- **AC-4 (negativo)**: Dado km atual ou valor de compra negativo,
  quando tenta salvar, então o formulário recusa.
- **AC-5**: Dado um veículo sem foto, quando aparece no card, então
  mostra um placeholder visual — nunca um espaço quebrado ou vazio sem
  explicação.
- **AC-6**: Dado um veículo existente, quando a pessoa envia uma foto
  principal, então a foto é enviada pro caminho
  `{user_id}/{vehicle_id}/{uuid}.{ext}`, uma linha nasce em
  `vehicle_photos`, `vehicles.primary_photo_id` aponta pra ela, e o
  card passa a mostrar a foto via signed URL.
- **AC-7 (negativo)**: Dado um arquivo que não é imagem, ou maior que
  o limite definido (ver Seção 11), quando a pessoa tenta enviar, então
  o sistema recusa antes de subir pro storage, com mensagem clara.
- **AC-8**: Dado um veículo existente, quando a pessoa edita qualquer
  campo (incluindo os opcionais e o status) e salva, então os dados
  persistem e o card/detalhe refletem a mudança.
- **AC-9**: Dado um veículo existente, quando a pessoa pede pra
  excluir, então o sistema pede confirmação explícita antes de
  apagar — nunca exclui num único clique.
- **AC-10**: Dado a confirmação de exclusão, quando a pessoa confirma,
  então o veículo some da lista.
- **AC-11**: Dado um veículo com gastos/abastecimentos já registrados
  em fases futuras (hoje: só o valor de compra), quando aparece na
  lista, então "total investido" vem de `vehicle_financial_summary`
  (`total_invested`) — nunca somado no cliente.
- **AC-12**: Dado dois veículos do mesmo usuário, quando a lista
  carrega, então cada card mostra os dados do veículo certo — nunca
  dado de um veículo aparecendo no card de outro.
- **AC-13 (negativo)**: Dado o usuário A autenticado, quando a lista
  carrega, então só aparecem veículos de A — nunca de outro usuário
  (garantido pela RLS, mas o comportamento observável precisa bater).

## 6. Regras de negócio

- **RN-1**: `vehicles.user_id` é sempre o usuário autenticado atual —
  nunca um campo editável no formulário.
- **RN-2**: Total investido, custo por km e qualquer outro número
  derivado vêm de `vehicle_financial_summary` — nunca somado ou
  recalculado no cliente.
- **RN-3**: Upload de foto segue exatamente
  `{user_id}/{vehicle_id}/{uuid}.{ext}` no bucket `vehicle-photos`.
- **RN-4**: Foto é sempre exibida via signed URL — nunca URL pública do
  bucket.
- **RN-5**: `status` default `active` quando não especificado na
  criação.
- **RN-6**: "Versão" no card e no formulário é a coluna `trim` do
  banco — nome amigável em português pra um campo cujo nome técnico é
  em inglês (convenção da Seção 5 do documento mestre).

## 7. Dados

| Informação | Origem | Obrigatória? | Observação |
|---|---|---|---|
| Marca, modelo, ano, km atual, combustível, câmbio, data de compra, valor de compra | Formulário de criação | Sim | Campos obrigatórios da tabela `vehicles` |
| Versão (trim), cor, placa, motor (descrição/cilindrada/potência/torque), valor estimado atual, notas | Formulário — "mais detalhes" | Não | Editáveis a qualquer momento |
| Status | Formulário de edição | Não — default "Ativo" | `active` / `project` / `stored` / `sold` |
| Foto principal | Upload no storage + `vehicle_photos` | Não | Opcional na criação, disponível na edição |
| Total investido, custo por km | `vehicle_financial_summary` | — | Somente leitura, nunca calculado no cliente |

## 8. Estados e transições

`status` do veículo: `active` ⇄ `project` ⇄ `stored` ⇄ `sold` — todas
as transições entre os 4 valores são permitidas (o contrato não impõe
uma máquina de estados restrita aqui). `archived_at` não é tocado nesta
fase.

## 9. Erros e casos de borda

- Campo obrigatório faltando → AC-3.
- Km atual ou valor de compra negativo → AC-4.
- Arquivo de foto inválido (tipo errado ou grande demais) → AC-7.
- Falha de rede durante upload → veículo permanece como estava antes
  da tentativa, mensagem de erro, pode tentar de novo.
- Exclusão de veículo com dado relacionado em outra tabela (gastos,
  fotos etc.) → o banco decide o que acontece com esse dado (fora do
  nosso controle); o cliente só confirma a ação e reflete o resultado.
- Lista vazia → AC-1.
- Erro de rede ao carregar a lista → estado de erro com "tentar de
  novo".

## 10. Requisitos não-funcionais

- Responsivo de 320px a 1440px+, sem overflow horizontal.
- Loading da lista com skeleton de card (layout previsível), não
  spinner genérico.
- Navegação por teclado completa nos formulários e nas ações de
  card (editar/excluir), foco visível.
- Confirmação de exclusão acessível (anunciada, não só um modal
  visual).
- Nenhuma foto acessível por URL pública — sempre signed URL.

## 11. Dependências e riscos

- **Depende de**: Fase 1 (`001-auth`) — rota protegida e usuário
  autenticado.
- **Decisão técnica (não bloqueante)**: limite de arquivo de foto
  definido como 5MB, tipos aceitos `image/jpeg`, `image/png`,
  `image/webp` — validado no cliente antes do upload. Ajustável depois
  se o produto pedir outra coisa.
- **Risco**: exclusão de veículo com dado relacionado em cascata —
  comportamento real depende de constraint do banco (fora do meu
  controle). Vou testar e reportar o que observar na verificação, não
  presumir.

## 12. Perguntas abertas

Nenhuma pergunta pendente.
