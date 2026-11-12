// Open Finance (via Meu Pluggy) para uso exclusivo da dona do app.
// As credenciais da Pluggy ficam em segredos do Supabase e nunca vão para o navegador.
// Segredos usados: PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET, PLUGGY_ITEM_IDS (ids separados por vírgula).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ID da dona do app: fica no segredo OWNER_ID do Supabase, nunca no código.
const OWNER_ID = (Deno.env.get("OWNER_ID") ?? "").trim();
const PLUGGY = "https://api.pluggy.ai";
const ALLOWED = ["https://fluxo-previsto.netlify.app", "http://localhost:8000", "http://127.0.0.1:8000"];

function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

async function pluggy(path: string, apiKey: string) {
  const r = await fetch(PLUGGY + path, { headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" } });
  if (!r.ok) {
    let detail = ""; try { const j = await r.json(); detail = String(j.message ?? j.error ?? j.code ?? "").slice(0, 160); } catch { /* sem corpo */ }
    throw new Error(`Pluggy ${path.split("?")[0]} respondeu ${r.status}${detail ? ": " + detail : ""}`);
  }
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method" });

  // 1. Só a dona do app passa daqui
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user } } = await sb.auth.getUser(token);
  if (!OWNER_ID || !user || user.id !== OWNER_ID) return json(req, 403, { error: "forbidden" });

  let body: { action?: string; from?: string; to?: string } = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }

  // Remove espaços, quebras de linha e aspas que costumam vir junto ao colar
  const clean = (v: string | undefined) => (v ?? "").replace(/[\s"'`]/g, "");
  const clientId = clean(Deno.env.get("PLUGGY_CLIENT_ID"));
  const clientSecret = clean(Deno.env.get("PLUGGY_CLIENT_SECRET"));
  const itemIds = (Deno.env.get("PLUGGY_ITEM_IDS") ?? "").split(/[,;\s]+/).map((s) => clean(s)).filter(Boolean);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Diagnóstico sem expor as chaves: só formato e tamanho
  const diag = {
    clientIdIsUuid: UUID.test(clientId), clientIdLength: clientId.length,
    clientSecretLength: clientSecret.length, secretLooksLikeUuid: UUID.test(clientSecret),
    itemIds: itemIds.length, itemIdsAreUuid: itemIds.every((i) => UUID.test(i)),
  };
  const configured = !!(clientId && clientSecret && itemIds.length);

  if (body.action === "ping") return json(req, 200, { enabled: true, configured, banks: itemIds.length, diag });
  if (!configured) return json(req, 409, { error: "not_configured" });

  try {
    // 2. Autentica na Pluggy (a chave dura 2 horas; pedimos uma nova a cada sincronização)
    const auth = await fetch(PLUGGY + "/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    if (!auth.ok) {
      let detail = "";
      try { const j = await auth.json(); detail = String(j.message ?? j.error ?? j.code ?? "").slice(0, 200); } catch { /* sem corpo */ }
      console.error("pluggy_auth", auth.status, detail, JSON.stringify(diag));
      return json(req, 502, { error: "pluggy_auth", status: auth.status, detail, diag });
    }
    const { apiKey } = await auth.json();

    const today = new Date().toISOString().slice(0, 10);
    const from = /^\d{4}-\d{2}-\d{2}$/.test(body.from ?? "") ? body.from! : new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
    const to = /^\d{4}-\d{2}-\d{2}$/.test(body.to ?? "") ? body.to! : today;

    const banks: unknown[] = [], accounts: unknown[] = [], transactions: unknown[] = [];
    for (const itemId of itemIds) {
      const short = itemId.length > 14 ? itemId.slice(0, 8) + "…" : itemId;
      // 3. Banco (item): um ID com problema não impede os outros de sincronizar
      if (!UUID.test(itemId)) {
        console.error("item_invalido", itemId.length);
        banks.push({ itemId, name: `Item ID ${short}`, status: "ID em formato inválido: confira o PLUGGY_ITEM_IDS", lastUpdatedAt: null });
        continue;
      }
      let item: any = null, itemErr = "";
      try { item = await pluggy(`/items/${encodeURIComponent(itemId)}`, apiKey); }
      catch (e) { itemErr = String((e as Error).message ?? e).replace(/^Pluggy /, ""); console.error("item_detalhe_falhou", short, itemErr); }
      console.log("item", short, item?.connector?.name ?? "?", item?.status ?? "?", item?.executionStatus ?? "?", item?.lastUpdatedAt ?? "?");
      const STATUS: Record<string, string> = {
        UPDATING: "Ainda copiando os dados do banco. Tente de novo em alguns minutos.",
        LOGIN_ERROR: "A autorização deste banco expirou. Reconecte no Meu Pluggy.",
        WAITING_USER_INPUT: "O banco está pedindo uma confirmação. Abra o Meu Pluggy.",
        OUTDATED: "Os dados deste banco estão desatualizados na Pluggy.",
      };
      const statusText = item ? (STATUS[item.status] ?? null) : (itemErr ? `Detalhes indisponíveis (${itemErr})` : null);
      let acc: any;
      try { acc = await pluggy(`/accounts?itemId=${encodeURIComponent(itemId)}`, apiKey); }
      catch (e) {
        const msg = String((e as Error).message ?? e);
        console.error("item_falhou", short, msg);
        banks.push({ itemId, name: item?.connector?.name ?? `Item ID ${short}`, status: `Não foi possível ler este banco (${msg.replace(/^Pluggy /, "")})`, lastUpdatedAt: null });
        continue;
      }
      const n = (acc.results ?? []).length;
      console.log("contas", short, n);
      banks.push({ itemId, name: item?.connector?.name ?? `Conexão ${short}`, lastUpdatedAt: item?.lastUpdatedAt ?? null,
        status: statusText ?? (n === 0 ? "Nenhuma conta liberada nesta conexão ainda. Se acabou de conectar, aguarde alguns minutos." : null) });
      for (const a of acc.results ?? []) {
        accounts.push({
          id: a.id, itemId, bank: item?.connector?.name ?? "", type: a.type, subtype: a.subtype,
          name: a.marketingName || a.name, number: a.number, balance: a.balance,
          closeDate: a.creditData?.balanceCloseDate ?? null, dueDate: a.creditData?.balanceDueDate ?? null,
        });
        // 4. Transações do período, com paginação por cursor (no máximo 20 páginas de 500)
        let next: string | null = `?accountId=${encodeURIComponent(a.id)}&dateFrom=${from}&dateTo=${to}`;
        try {
          for (let page = 0; next && page < 20; page++) {
            const r: any = await pluggy(`/v2/transactions${next}`, apiKey);
            for (const t of r.results ?? []) {
              transactions.push({ id: t.id, accountId: a.id, date: t.date, description: t.description || t.descriptionRaw || "", amount: t.amount, type: t.type, status: t.status });
            }
            next = r.next ?? null;
          }
        } catch (e) {
          console.error("transacoes_falharam", String((e as Error).message ?? e));
        }
      }
    }
    return json(req, 200, { from, to, banks, accounts, transactions });
  } catch (e) {
    console.error("pluggy", String((e as Error).message ?? e));
    return json(req, 502, { error: "pluggy", message: String((e as Error).message ?? e) });
  }
});
