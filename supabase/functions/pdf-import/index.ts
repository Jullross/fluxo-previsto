// Leitura de faturas e extratos em PDF ou em prints (JPG, PNG, WebP, HEIC) com o Gemini (plano gratuito), só para a dona do app.
// A chave fica no segredo GEMINI_API_KEY do Supabase e nunca vai para o navegador.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ID da dona do app: fica no segredo OWNER_ID do Supabase, nunca no código.
const OWNER_ID = (Deno.env.get("OWNER_ID") ?? "").trim();
const ALLOWED = ["https://fluxo-previsto.netlify.app", "http://localhost:8000", "http://127.0.0.1:8000"];
// Primeiro o modelo mais leve; se a leitura falhar ou vier vazia, tenta o mais capaz.
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];
const MAX_B64 = 14_000_000; // cerca de 10 MB somando todos os arquivos
const MAX_FILES = 8;       // prints de várias telas da mesma fatura
const MIMES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
type Part = { data: string; mime: string };

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

const PROMPT = `Você é um leitor de faturas de cartão de crédito e extratos bancários brasileiros.
O anexo é uma fatura ou um extrato: um PDF ou um ou mais prints (capturas de tela do app ou do site do banco, ou fotos do papel). Extraia TODOS os lançamentos.
Quando houver vários prints, eles são partes do mesmo documento, em sequência: um lançamento que aparece em dois prints (por causa da rolagem) entra uma vez só.

Responda somente com um objeto JSON neste formato:
{"banco": string, "tipo": "fatura"|"extrato", "fechamento": "AAAA-MM-DD"|null, "vencimento": "AAAA-MM-DD"|null, "total": number|null,
 "transacoes": [{"data":"AAAA-MM-DD","descricao":string,"valor":number,"tipo":"saida"|"entrada","categoria":"essencial"|"estilo"|"futuro"|"metas"|null,"parcela":"2/6"|null,"pagamento_fatura":boolean}]}

Regras:
- valor sempre positivo; "tipo" diz se o dinheiro saiu ou entrou. Estornos, créditos e salários são "entrada".
- Se a data vier sem ano, deduza pelo período do documento (uma fatura de janeiro pode ter compras de dezembro do ano anterior).
- Prints de app costumam dizer "Hoje", "Ontem" ou só o dia da semana: converta para a data real usando a data de hoje informada no fim.
- Ignore botões, menus, barras do celular (hora, bateria) e textos de propaganda que aparecem no print.
- "descricao": nome limpo e legível do estabelecimento (sem códigos, asteriscos ou números de terminal).
- "parcela": preencha quando aparecer algo como "PARC 03/10" ou "2/6". Compras parceladas vão em "futuro".
- "categoria" (somente para saídas; para entradas use null):
  essencial = sobrevivência: mercado, farmácia, transporte, combustível, contas de casa, saúde, educação obrigatória;
  estilo = estilo de vida: delivery, restaurantes, lazer, streaming, compras, academia, viagens, tarifas e IOF;
  futuro = parcelas, empréstimos, financiamentos e acordos de dívida;
  metas = aplicações, investimentos, caixinhas, reserva de emergência.
- "pagamento_fatura": true só para o pagamento da própria fatura anterior.
- Não invente lançamentos. Ignore linhas de saldo, limite, juros informativos e propaganda.`;

async function askGemini(model: string, key: string, files: Part[]) {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [
        ...files.map((f) => ({ inline_data: { mime_type: f.mime, data: f.data } })),
        { text: `${PROMPT}\n\nData de hoje: ${today}.` },
      ] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    }),
  });
  if (!r.ok) {
    let detail = ""; try { const j = await r.json(); detail = String(j?.error?.message ?? "").slice(0, 200); } catch { /* sem corpo */ }
    const err = new Error(`${r.status}${detail ? ": " + detail : ""}`) as Error & { status?: number };
    err.status = r.status; throw err;
  }
  const out = await r.json();
  const text = (out?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const data = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
  if (!data || !Array.isArray(data.transacoes)) throw new Error("formato inesperado");
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method" });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user } } = await sb.auth.getUser(token);
  if (!OWNER_ID || !user || user.id !== OWNER_ID) return json(req, 403, { error: "forbidden" });

  let body: { action?: string; pdf?: string; files?: { data?: string; mime?: string }[] } = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }
  const key = (Deno.env.get("GEMINI_API_KEY") ?? "").replace(/[\s"'`]/g, "");

  if (body.action === "ping") return json(req, 200, { enabled: true, configured: !!key, images: true });
  if (!key) return json(req, 409, { error: "not_configured" });
  // Formato novo: files = [{data, mime}]. O antigo (pdf = base64) continua aceito.
  const files: Part[] = Array.isArray(body.files)
    ? body.files.map((f) => ({ data: String(f?.data ?? ""), mime: String(f?.mime ?? "").toLowerCase() })).filter((f) => f.data)
    : body.pdf ? [{ data: String(body.pdf), mime: "application/pdf" }] : [];
  if (!files.length) return json(req, 400, { error: "no_file" });
  if (files.length > MAX_FILES) return json(req, 413, { error: "too_many" });
  if (files.some((f) => !MIMES.includes(f.mime))) return json(req, 415, { error: "bad_type" });
  if (files.reduce((s, f) => s + f.data.length, 0) > MAX_B64) return json(req, 413, { error: "too_large" });

  let last = "";
  for (const model of MODELS) {
    try {
      const data = await askGemini(model, key, files);
      if (data.transacoes.length === 0 && model !== MODELS[MODELS.length - 1]) { last = "vazio"; continue; }
      return json(req, 200, { model, data });
    } catch (e) {
      const err = e as Error & { status?: number };
      last = String(err.message ?? e);
      console.error("gemini", model, last);
      if (err.status === 400 && /API key/i.test(last)) return json(req, 401, { error: "bad_key" });
      if (err.status === 403) return json(req, 401, { error: "bad_key" });
      if (err.status === 429) return json(req, 429, { error: "rate_limited" });
    }
  }
  return json(req, 502, { error: "read_failed", message: last });
});
