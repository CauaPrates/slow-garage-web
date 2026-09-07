# Spec 020 — Assistente de preenchimento por FIPE

| | |
|---|---|
| **Status** | implementada (parcial — ver §11) |
| **Tamanho** | G |
| **Criada em** | 2026-09-05 |
| **Depende de** | specs/002-garage (`VehicleForm`) |

## 1. Problema

Cadastrar veículo hoje é digitar marca, modelo e ano na mão, sem
referência. Erro de digitação vira dado ruim que contamina relatório
depois, e o usuário raramente sabe o valor de mercado do próprio carro
pra preencher "valor estimado atual".

## 2. Resultado esperado

O usuário escolhe marca e modelo numa lista buscável e o formulário se
preenche sozinho. Opcionalmente escolhe o ano e recebe o valor de
referência da tabela FIPE como **sugestão**. Nada disso é obrigatório: o
formulário manual continua funcionando exatamente como antes, inclusive
com a FIPE fora do ar.

## 3. Cenários

**Principal**
1. Usuário abre o cadastro de veículo e vê o bloco "Buscar dados na FIPE"
   fechado, acima dos campos manuais.
2. Abre o bloco, escolhe a marca (busca por digitação), depois o modelo.
3. Clica em "Preencher com dados FIPE" — marca e modelo caem nos campos
   de texto do formulário.
4. Opcionalmente pede o ano, escolhe um, vê o valor de referência e
   decide se usa.

**Alternativos**
- FIPE fora do ar: cada consulta mostra seu próprio erro; o resto do
  formulário não é afetado.
- Carro não está na FIPE: "Não encontrei meu carro" fecha o bloco sem
  apagar nada já digitado.

## 4. Escopo

**Dentro**
- Cliente da API FIPE externa com timeout e erro explícito.
- Camada de marca/modelo com interface estável (`fipeCache`).
- 4 hooks TanStack Query; ano e valor **só sob demanda**.
- Bloco colapsável no `VehicleForm` (criação e edição), com combobox
  buscável.
- Preenchimento de `make`, `model`, `modelYear` e `estimatedCurrentValue`.

**Fora**
- Persistir qualquer dado da FIPE no Supabase.
- Motos e caminhões (a API tem `/motos` e `/caminhoes`; V1 é só carro).
- Preencher combustível/câmbio a partir da FIPE — o texto dela
  ("Flex", "mec.") não mapeia 1:1 nos enums do banco.

## 5. Critérios de aceite

- **AC-1**: O bloco nasce fechado e o formulário manual funciona sem
  tocar nele.
- **AC-2**: Marca e modelo são escolhidos em lista buscável por
  digitação, em cascata (modelo desabilitado sem marca).
- **AC-3**: Ano e valor **não** são consultados ao escolher o modelo —
  só depois de um gesto explícito do usuário.
- **AC-4**: "Preencher com dados FIPE" escreve nos campos de texto
  existentes, que continuam editáveis.
- **AC-5**: Com ano escolhido, o preenchimento inclui o ano.
- **AC-6**: O valor da FIPE é oferecido como sugestão rotulada, com mês
  de referência, e só entra no campo se o usuário aceitar.
- **AC-7**: "Não encontrei meu carro" fecha o bloco preservando tudo que
  já estava no formulário.
- **AC-8**: Falha de rede/timeout aparece como erro local do bloco, sem
  quebrar o formulário.
- **AC-9**: Sem overflow horizontal e sem violação séria de axe em
  320/390/1440, nos dois temas.

## 6. Regras de negócio

- **RN-1**: Nada vindo da FIPE é dado calculado pelo sistema. Cai em
  campo de texto comum, editável, nunca em campo somente-leitura.
- **RN-2**: Nenhuma consulta da FIPE é persistida no Supabase.
- **RN-3**: Regra de negócio do backend não é duplicada aqui — este bloco
  só preenche campo de formulário.
- **RN-4**: A API externa é terceiro sem SLA: toda chamada tem timeout e
  estado de erro próprio.

## 7. Dados

Nenhuma escrita nova. Leitura de API externa, não persistida. Campos do
formulário afetados: `make`, `model`, `modelYear`,
`estimatedCurrentValue` — todos já existentes.

## 8. Estados e transições

N/A — o bloco é um assistente sem entidade própria.

## 9. Erros e casos de borda

- Timeout (10s), rede, HTTP != 2xx e resposta inesperada viram
  `FipeError` com mensagem em português.
- Valor que não dá pra converter em número não entra no campo.
- Trocar de marca limpa modelo, ano e valor — evita combinação inválida.

## 10. Requisitos não-funcionais

- Catálogo com `staleTime` de 24h (marca/modelo mudam raramente); valor
  sem cache longo (a tabela muda de mês em mês).
- `retry: 1` — insistir contra terceiro sem SLA só aumenta a espera.

## 11. Perguntas abertas / pendências

**O pressuposto do pedido não se confirmou.** `npm run types` contra o
projeto remoto não trouxe `fipe_brands`, `fipe_models` nem
`vehicles.fipe_brand_id`/`fipe_model_id`. Consequências, registradas no
ADR-075:

1. `fipeCache` lê da API externa, não do Supabase (interface preservada).
2. Gravar `fipe_brand_id`/`fipe_model_id` em background **não foi
   implementado** — as colunas não existem. Os códigos já saem no
   `FipeFillPayload` pra ligar isso numa linha quando a migration entrar.
