---
name: slow-garage-data
description: Contrato da camada de dados do Slow Garage — supabase-js + TanStack Query. Convenção de query keys, invalidação, update otimista, upload no Storage, tradução de erro do Postgres para português, e as proibições do contrato com o backend. Use SEMPRE que o trabalho tocar em buscar, criar, editar ou apagar dado, chamar RPC, subir ou exibir arquivo, montar hook de dados, tratar erro de mutação, ou calcular qualquer número que aparece na tela. Gatilhos: "buscar", "listar", "salvar", "registrar", "atualizar", "invalidar", "cache", "query", "mutation", "upload", "foto", "documento", "total", "média", "consumo", "custo por km", "supabase", "RLS", "erro ao salvar".
---

# Camada de dados — Slow Garage

O backend é um Supabase congelado: 16 tabelas, views e RPCs, RLS em tudo, 137 testes pgTAP verdes. `docs/API_CONTRACT.md` é a fonte da verdade — leia antes de escrever hook novo.

Você não altera schema, policy, view, função ou bucket. Se falta dado, **pare e reporte**; a correção é no repositório do backend.

## Três proibições

Violar qualquer uma produz bug que ninguém encontra por semanas, porque o número aparece plausível.

**1. Nunca recalcule campo calculado pelo banco.**

`price_per_liter`, `km_per_liter`, `cost_per_km`, status de manutenção, progresso de projeto, saldo de financiamento, totais — tudo vem pronto de view ou RPC. Se você somar ou dividir no cliente, cria uma segunda fonte de verdade que vai divergir, e ninguém vai saber qual está certa.

Se você está escrevendo `reduce((acc, x) => acc + x.amount, 0)` sobre dado do servidor, pare: provavelmente existe uma view para isso. Procure no contrato antes.

**2. Abastecimento não é gasto duplicado.**

`fuel_logs` deliberadamente **não** é espelhado em `expenses`. Nunca some as duas coleções no cliente para chegar ao total do veículo — use a view de resumo financeiro, que já faz isso corretamente. Somar as duas conta combustível duas vezes; somar só `expenses` esconde o combustível.

**3. Storage segue o path exato.**

```
{user_id}/{vehicle_id}/{uuid}.{ext}
```

As policies extraem o `user_id` do primeiro segmento e validam o `vehicle_id` no segundo. Path errado = upload rejeitado pelo RLS, sem mensagem útil.

Buckets são **privados**. Leitura sempre por `createSignedUrl`, nunca `getPublicUrl` — que vai retornar URL que dá 400. Signed URL expira: gere no momento do uso, com TTL curto, e deixe o TanStack Query cuidar do cache com `staleTime` menor que o TTL.

MIME permitido: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Valide **antes** de subir, para o erro ser em português e não vir do servidor.

## Client

Tipado com o `Database` gerado, para erro de coluna aparecer em tempo de compilação:

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

`src/types/database.types.ts` é gerado (`npm run types`) e **nunca** editado à mão. Se o tipo está errado, o schema mudou — regenere.

Só a chave `anon` vive aqui. `service_role` nunca entra neste repositório, em nenhuma circunstância. Se você sentir necessidade dela, o desenho está errado — pare e reporte.

## Query keys

Hierárquicas, do geral para o específico, para invalidação por prefixo funcionar:

```ts
export const qk = {
  vehicles: ['vehicles'] as const,
  vehicle: (id: string) => ['vehicles', id] as const,
  expenses: (vehicleId: string, filters?: unknown) =>
    ['vehicles', vehicleId, 'expenses', filters ?? {}] as const,
  dashboard: (vehicleId: string) => ['vehicles', vehicleId, 'dashboard'] as const,
} as const;
```

Nunca escreva key inline num `useQuery`. Toda key nasce nesse objeto — é o que permite invalidar sem sair caçando string pelo projeto.

Filtro entra na key. Filtro fora da key produz dado de um filtro aparecendo em outro.

## Invalidação

Invalide o que mudou e o que **deriva** do que mudou. O erro mais comum aqui é invalidar a lista e esquecer os agregados.

Registrar um gasto afeta: a lista de gastos, a timeline, a dashboard, e os agregados por mês e por categoria. Invalidar por prefixo `['vehicles', vehicleId]` resolve de uma vez e é aceitável na escala do beta — mais simples do que enumerar e mais seguro do que esquecer um.

Não invalide o que não mudou. Invalidar tudo em toda mutação transforma cada registro em recarga geral e o app fica lento no 4G do posto.

## Update otimista

Onde a espera atrapalha a percepção de velocidade — registrar gasto, registrar abastecimento, marcar item de projeto — use otimista com rollback:

```ts
onMutate: async (novo) => {
  await qc.cancelQueries({ queryKey: qk.expenses(vehicleId) });
  const anterior = qc.getQueryData(qk.expenses(vehicleId));
  qc.setQueryData(qk.expenses(vehicleId), (old) => [novo, ...(old ?? [])]);
  return { anterior };
},
onError: (_e, _novo, ctx) => {
  qc.setQueryData(qk.expenses(vehicleId), ctx?.anterior);
},
onSettled: () => qc.invalidateQueries({ queryKey: ['vehicles', vehicleId] }),
```

**Não** use otimista onde o servidor calcula o resultado — abastecimento tem `km/L` que só o banco sabe. Nesse caso, otimize a lista mas deixe a métrica carregar. Mostrar número otimista errado e corrigir depois é pior do que mostrar skeleton por 400ms.

## Erro

Erro do Postgres nunca chega cru na tela. `duplicate key value violates unique constraint "fuel_logs_vehicle_id_odometer_km_key"` não é mensagem de usuário.

Centralize a tradução num helper e mapeie os casos reais por código:

| Código | Significado | Mensagem |
|---|---|---|
| `23505` | unique violation | "Já existe um registro com essa quilometragem" |
| `23503` | foreign key | "O item vinculado não existe mais" |
| `23514` | check violation | "Valor inválido para este campo" |
| `42501` / vazio inesperado | RLS negou | "Você não tem acesso a este registro" |
| `PGRST116` | nenhuma linha | tratar como "não encontrado", não como erro |

Atenção ao caso silencioso: **RLS não retorna erro de permissão, retorna lista vazia.** Se uma query devolve zero linhas onde devia ter dado, suspeite de RLS ou de `vehicle_id` errado antes de suspeitar de bug de UI.

## Schema de formulário espelha o banco

O zod copia a constraint do Postgres. Coluna `not null` → campo obrigatório. `check (odometer_km >= 0)` → `.min(0)`. `numeric(12,2)` → duas casas.

Divergência aqui significa que o usuário preenche, envia, e recebe erro do banco em inglês. Validação do cliente existe para que o servidor nunca precise recusar.

Entrada em pt-BR: o usuário digita `45,7` litros e `R$ 1.234,56`. Converta na borda do formulário, com os helpers de `lib/format.ts`. Nunca `parseFloat` direto em string com vírgula.

## Prefira RPC

A dashboard tem `get_vehicle_dashboard`, a busca tem `search_vehicle`. Uma chamada tipada resolve o que dez queries de tabela resolveriam pior. Se você está montando cinco `useQuery` para preencher uma tela, confira no contrato se existe RPC.
