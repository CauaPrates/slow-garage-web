# Verificação 002 — Minha Garagem

| | |
|---|---|
| **Spec** | ./spec.md |
| **Verificado em** | 2026-09-02 |
| **Resultado** | aprovado |

## Critérios de aceite

| AC | Resultado | Evidência |
|---|---|---|
| AC-1 | ⚠️ verificado por revisão de código, não visualmente | `alice@dev.local` e `bob@dev.local` já vêm com um veículo seedado cada — não presenciei o estado vazio ao vivo nesta sessão. Optei por não apagar o veículo seed de nenhuma das duas contas só pra ver a tela vazia (perderia dado fixture útil pra fases futuras). A branch `vehicles?.length === 0` é a mesma estrutura condicional já provada nas outras telas de lista do projeto — baixo risco, mas registrando a limitação honestamente. Ver "Para o humano testar na mão" |
| AC-2 | ✅ | Criado "Toyota Corolla" 2019 com os 8 campos obrigatórios → apareceu na lista com status "Ativo" |
| AC-3 | ✅ | Submit com formulário vazio → 8 mensagens de erro, uma por campo obrigatório, nenhuma chamada ao servidor |
| AC-4 | ✅ | Km atual `-5` → "a quilometragem atual inválido.", recusado antes do servidor |
| AC-5 | ✅ | Veículo recém-criado sem foto → nenhum `<img>` no card, ícone de carro (placeholder) no lugar |
| AC-6 | ✅ | Upload de PNG 1×1 real no veículo do bob: `POST .../storage/v1/object/vehicle-photos/{user_id}/{vehicle_id}/{uuid}.png` → `200`; `vehicle_photos` ganhou linha; `vehicles.primary_photo_id` atualizado; após reload, card carrega `<img>` com `src` em `/storage/v1/object/sign/...` (signed URL, não pública) |
| AC-7 | ✅ | Tentativa de upload de um `.pdf` → "Envie uma imagem JPEG, PNG ou WebP.", recusado antes de qualquer chamada de upload |
| AC-8 | ✅ | Editado cor, placa e status (`stored`) do veículo do bob → diálogo fecha, `reload()` confirma "Guardado" persistido. (Status revertido pra "Projeto" depois, pra não deixar o dado seed alterado) |
| AC-9 | ✅ | Clique em excluir → diálogo de confirmação aparece; "Cancelar" mantém o veículo na lista |
| AC-10 | ✅ | Confirmar exclusão → veículo some da lista |
| AC-11 | ✅ | Card mostra `total_invested` de `vehicle_financial_summary` (`R$ 55.000,00` pro veículo novo = valor de compra puro; `R$ 48.210,00` pro Opala seedado, que já tem gasto/abastecimento agregado — número não bate com nenhum campo isolado da tabela `vehicles`, confirmando que vem da view, não de soma no cliente) |
| AC-12 | ✅ | Dois veículos na garagem do bob (Corolla + Opala) — screenshot confirma dados distintos e corretos em cada card |
| AC-13 | ✅ | Login como `alice@dev.local` → vê só "Volkswagen Golf GTI" (seed dela), nunca o "Chevrolet Opala" do bob |

✅ atende · ❌ não atende · ⚠️ parcial · ⬜ não verificado

## Achados durante a verificação (bug real corrigido)

**Truncamento de `<select>` em 320px**: `ui:check` mostrou "Selecione" cortado pra "Selecior" nos campos Combustível/Câmbio quando pareados 2-colunas numa tela de 320px. Corrigido trocando `grid-cols-2` fixo por `grid-cols-1 sm:grid-cols-2` em todo par de campo do formulário (ADR-019). Ao mesmo tempo, formalizado `max-h-[85vh]` + scroll interno em `Dialog`/`AlertDialog` (antes só o `EditVehicleDialog` tinha isso, artesanalmente) — testado com viewport real de celular (375×667): diálogo de criação cabe e o botão de salvar continua alcançável via scroll (ADR-020).

## Saída dos comandos

### Build
```
> slow-garage-web@0.0.0 build
> tsc -b && vite build
✓ 2000+ modules transformed.
✓ built in 374ms
PWA v1.3.0 — precache 24 entries (940.63 KiB)
```

### Lint / tipos
```
$ npx tsc -b --noEmit
(sem saída — sem erro)

$ npm run lint
> eslint .
(sem saída — sem erro nem warning)
```

### `ui:check` manual (autenticado, `/` com garagem + diálogo de criação aberto)

```
[320]  overflow: 320 vs 320 (ok) | axe violations: 0 | console errors: 0
[390]  overflow: 390 vs 390 (ok) | axe violations: 0 | console errors: 0
[768]  overflow: 768 vs 768 (ok) | axe violations: 0 | console errors: 0
[1440] overflow: 1440 vs 1440 (ok) | axe violations: 0 | console errors: 0
```
0 violações de axe e 0 overflow em 4 viewports, tanto na lista quanto
com o diálogo de criação aberto (8 combinações no total).

### RN-2 (nenhum cálculo financeiro no cliente)
```
$ grep -rn "purchase_price +|total_invested =|reduce(" src/features/vehicle/
(sem saída — nenhuma soma manual encontrada)
```

## Pendências

- **AC-1**: não visto ao vivo nesta sessão (ver justificativa na tabela acima). Baixo risco — mesma estrutura condicional das demais telas.
- **Foto real**: o teste de upload usou um PNG de 1×1 pixel (fixture mínima) — funcionalmente prova o fluxo inteiro (path, insert, signed URL, persistência), mas não mostra como uma foto de carro de verdade fica enquadrada no card/diálogo. Ver item 1 em "Para o humano testar na mão".
- Nenhuma pendência de código conhecida.

## Para o humano testar na mão

1. Enviar uma foto real (não um pixel de teste) num veículo e conferir o enquadramento (`object-cover`) no card da lista e no preview do diálogo de edição.
2. Pra ver o estado vazio de verdade: criar uma conta nova (sujeito ao limite de e-mail do Supabase, ver ADR-016) ou apagar temporariamente o único veículo de uma conta de teste.
3. Testar em celular real: abrir o diálogo de criação com o teclado virtual aberto, confirmar que dá pra rolar até o botão "Cadastrar veículo".
4. Excluir um veículo que já tenha gasto/abastecimento associado (nenhum dos criados nesta verificação tinha) e observar se o banco realmente casqueia os dados relacionados ou se aparece algum erro — não testado nesta sessão porque nenhuma fase seguinte (gastos, abastecimento) existe ainda pra gerar esse dado.
