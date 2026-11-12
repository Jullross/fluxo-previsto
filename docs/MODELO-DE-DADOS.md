# Modelo de dados

Cada pessoa tem uma única linha no banco, com todos os dados num JSON. As projeções nunca são gravadas: são recalculadas a partir desse JSON.

## Tabela `public.fluxo_data`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `user_id` | uuid, chave primária | Referência a `auth.users`; apaga junto com a conta |
| `data` | jsonb | Todo o estado do app |
| `updated_at` | timestamptz | Atualizado por gatilho (`fluxo_touch_updated_at`) a cada gravação |

RLS ligado, com 4 políticas (lê, cria, atualiza, apaga), todas com `auth.uid() = user_id`. O papel `anon` não tem acesso. A tabela está na publicação de tempo real. O script completo está em [`supabase-schema.sql`](../supabase-schema.sql).

## O JSON do estado (versão 3)

| Chave | Conteúdo |
| --- | --- |
| `settings` | `baseMonth` (`AAAA-MM`), `initialBalance`, `targets`, `targetMode`, `accent`, `weekendWeight`, `of` |
| `accounts[]` | `id`, `name`, `kind` (`checking` ou `card`), `color`, `closeDay`, `dueDay`, `holder` (`own`, `shared`, `third`), `holderName`, `lastSync`, `reviewed` |
| `entries[]` | Lançamentos (abaixo) |
| `debts[]` | `name`, `creditor`, `original`, `current`, `cashOffer`, `instN`, `instAmount`, `simulate`, `simMode`, `simMonth` |
| `status` | Mapa `"<id>|AAAA-MM": true` = pago ou recebido naquele mês |
| `challenge` | `mode` padrão e `months` por mês: modo, `total` e `deposits` |
| `imported` | Chaves das linhas já importadas |
| `example` | `true` enquanto a conta mostra os dados de exemplo |

## Um lançamento

| Campo | Para que serve |
| --- | --- |
| `id`, `kind` | Identificador e tipo: `in` ou `out` |
| `type` | `single`, `recurring` ou `installment` |
| `name`, `cat` | Nome e bloco: `essencial`, `estilo`, `futuro` ou `metas` |
| `start`, `end` | Primeiro e último mês (`end` vazio = sem fim) |
| `day`, `dayRule`, `bdN` | Dia e regra: `fixed`, `bd5`, `bd5clt`, `lastbd`, `fixed-prev`, `fixed-next` |
| `amount` | Valor de um lançamento único |
| `changes[]` | Recorrentes: `{from, amount}`, o valor muda a partir do mês indicado |
| `total`, `n` | Parcelados: valor total e número de parcelas |
| `method`, `accountId` | Forma de pagamento e conta ou cartão |
| `whoUsed`, `whoName` | Gasto de outra pessoa no seu cartão |
| `reimbursementFor` | Liga o reembolso previsto ao gasto de origem |
| `importKey` | Origem na importação |

## Exemplo mínimo

```json
{
  "version": 3,
  "settings": {"baseMonth": "2026-11", "initialBalance": 900, "targets": {"essencial": 50, "estilo": 30, "fm": 20}},
  "accounts": [{"id": "acc_itau", "name": "Itaú", "kind": "checking", "color": "#3b82f6"}],
  "entries": [
    {"id": "a1", "kind": "in", "type": "recurring", "name": "Salário", "day": 5, "dayRule": "bd5", "start": "2026-11", "changes": [{"from": "2026-11", "amount": 2400}]},
    {"id": "a2", "kind": "out", "type": "installment", "name": "Notebook", "cat": "futuro", "day": 22, "start": "2026-09", "total": 1680, "n": 8}
  ],
  "status": {"a1|2026-11": true}
}
```
