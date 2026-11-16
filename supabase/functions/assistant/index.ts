// Assistente do app: responde perguntas sobre o dinheiro com o Gemini (plano gratuito), só para a dona do app.
// O navegador manda a pergunta, o histórico curto e um resumo dos números; a chave fica no segredo GEMINI_API_KEY.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OWNER_ID = (Deno.env.get("OWNER_ID") ?? "").trim();
const ALLOWED = ["https://jullross.github.io", "http://localhost:8000", "http://127.0.0.1:8000"];
// Primeiro o modelo leve (rápido, o mesmo que já lê os PDFs); se falhar, o mais capaz.
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];
const TIMEOUT_MS = 45_000; // cada tentativa; o Supabase corta a função em 150 s
const MAX_CTX = 60_000;

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

type Msg = { role: string; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method" });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user } } = await sb.auth.getUser(token);
  if (!OWNER_ID || !user || user.id !== OWNER_ID) return json(req, 403, { error: "forbidden" });

  const key = (Deno.env.get("GEMINI_API_KEY") ?? "").replace(/[\s"'`]/g, "");
  if (!key) return json(req, 409, { error: "not_configured" });

  let body: { system?: string; context?: unknown; messages?: Msg[] } = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-8)
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content ?? "").slice(0, 2000) }] }))
    .filter((m) => m.parts[0].text);
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json(req, 400, { error: "no_question" });
  const ctx = JSON.stringify(body.context ?? {}).slice(0, MAX_CTX);
  const system = String(body.system ?? "").slice(0, 4000) + "\n\ndados = " + ctx;

  let last = "";
  for (const model of MODELS) {
    const t0 = Date.now(), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", signal: ctl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: msgs, generationConfig: { temperature: 0.2, maxOutputTokens: 4096 } }),
      });
      if (r.status === 429) return json(req, 429, { error: "rate_limited" });
      if (!r.ok) { let d = ""; try { d = String((await r.json())?.error?.message ?? "").slice(0, 160); } catch { /* sem corpo */ } last = `${r.status} ${d}`; console.error("assistant", model, last, Date.now() - t0, "ms"); continue; }
      const out = await r.json();
      const text = (out?.candidates?.[0]?.content?.parts ?? []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? "").join("").trim();
      console.log("assistant", model, text ? "ok" : "vazio", Date.now() - t0, "ms", out?.candidates?.[0]?.finishReason ?? "");
      if (text) return json(req, 200, { model, text });
      last = "vazio";
    } catch (e) { last = ctl.signal.aborted ? "timeout" : String((e as Error).message ?? e); console.error("assistant", model, last, Date.now() - t0, "ms"); }
    finally { clearTimeout(timer); }
  }
  console.error("assistant", last);
  return json(req, 502, { error: last === "timeout" ? "timeout" : "read_failed" });
});
