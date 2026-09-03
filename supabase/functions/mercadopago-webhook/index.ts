
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// ─────────────────────────────────────────────────────────────────────────────
// Mercado Pago -> APEG payment webhook
//
// Security model:
//  1. Validates the `x-signature` HMAC (MP_WEBHOOK_SECRET) so only Mercado Pago
//     can trigger a state change.
//  2. NEVER trusts the request body for money. It re-fetches the payment from
//     the Mercado Pago API using the platform access token.
//  3. Only marks a registration as paid when status === 'approved'
//     AND the accredited amount covers the price stored in our own DB.
//  4. Idempotent: a registration already stamped with an mp_payment_id is left
//     untouched.
//  5. verify_jwt is disabled for this function (MP cannot send a Supabase JWT),
//     which is why steps 1–3 exist.
// ─────────────────────────────────────────────────────────────────────────────

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET") // from MP panel > Webhooks
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const enc = new TextEncoder()

async function validSignature(req: Request, dataId: string): Promise<boolean> {
  if (!MP_WEBHOOK_SECRET) {
    console.error("MP_WEBHOOK_SECRET no configurado — rechazando webhook.")
    return false
  }
  const sig = req.headers.get("x-signature") || ""
  const requestId = req.headers.get("x-request-id") || ""
  const parts = Object.fromEntries(
    sig.split(",").map((kv) => kv.split("=").map((s) => s.trim())),
  ) as Record<string, string>
  const ts = parts["ts"]
  const v1 = parts["v1"]
  if (!ts || !v1) return false

  // MP manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const manifest = `id:${dataId?.toLowerCase() ?? ""};request-id:${requestId};ts:${ts};`
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(MP_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  )
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(manifest))
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")

  // constant-time compare
  if (expected.length !== v1.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i)
  return diff === 0
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 })

  const url = new URL(req.url)
  let payload: any = {}
  try { payload = await req.json() } catch { /* MP sometimes sends empty body */ }

  const topic = payload?.type || payload?.topic || url.searchParams.get("type") || url.searchParams.get("topic")
  const paymentId = String(
    payload?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "",
  )

  // We only care about payment events.
  if (topic !== "payment" || !paymentId) {
    return new Response(JSON.stringify({ ignored: true }), { status: 200 })
  }

  if (!(await validSignature(req, paymentId))) {
    console.error("Firma de webhook inválida", { paymentId })
    return new Response("invalid signature", { status: 401 })
  }

  // Re-fetch the real payment from Mercado Pago. This is the source of truth.
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  })
  if (!mpRes.ok) {
    console.error("No se pudo consultar el pago en MP", paymentId, await mpRes.text())
    return new Response("mp fetch failed", { status: 502 }) // MP will retry
  }
  const payment = await mpRes.json()

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const meta = payment.metadata || {}
  const reference: string = payment.external_reference || meta.reference || ""
  const isTournament = meta.kind === "tournament_registration" || reference.startsWith("tourn_")

  if (!isTournament) {
    // Not our tournament flow (could be a store order handled elsewhere).
    return new Response(JSON.stringify({ ignored: "not-tournament" }), { status: 200 })
  }

  // Resolve which registrations this payment covers — by id list or by reference.
  let regIds: string[] = Array.isArray(meta.registration_ids) ? meta.registration_ids : []
  let query = supabase
    .from("tournament_registrations")
    .select("id, registration_status, mp_payment_id, tournament_id")
  query = regIds.length > 0 ? query.in("id", regIds) : query.eq("mp_reference", reference)
  const { data: regs, error } = await query
  if (error) { console.error(error); return new Response("db error", { status: 500 }) }
  if (!regs || regs.length === 0) {
    console.error("Webhook: sin inscripciones para", { reference, regIds })
    return new Response(JSON.stringify({ ok: true, matched: 0 }), { status: 200 })
  }

  const status = payment.status // approved | rejected | cancelled | refunded | ...
  const approved = status === "approved"
  const paidAmount = Number(payment.transaction_amount) || 0

  // Verify money: fetch the price we expect from our own DB, never from the body.
  const tournamentId = regs[0].tournament_id
  const { data: tournament } = await supabase
    .from("tournaments").select("price").eq("id", tournamentId).single()
  const unitPrice = Math.round(Number(tournament?.price) || 0)
  const pendingRegs = regs.filter((r: any) => !r.mp_payment_id)
  const expectedTotal = unitPrice * pendingRegs.length
  const amountOk = unitPrice > 0 && paidAmount + 1 >= expectedTotal // 1 COP tolerance

  if (approved && amountOk && pendingRegs.length > 0) {
    const { error: upErr } = await supabase
      .from("tournament_registrations")
      .update({
        registration_status: "paid",
        payment_date: new Date().toISOString(),
        mp_payment_id: String(paymentId),
      })
      .in("id", pendingRegs.map((r: any) => r.id))
      .is("mp_payment_id", null) // idempotency guard
    if (upErr) { console.error(upErr); return new Response("update failed", { status: 500 }) }
    console.log(`✅ Pago ${paymentId} acreditado — ${pendingRegs.length} inscripción(es)`)
    return new Response(JSON.stringify({ ok: true, updated: pendingRegs.length }), { status: 200 })
  }

  if (!approved) {
    console.log(`ℹ️ Pago ${paymentId} en estado "${status}" — inscripciones quedan pendientes`)
  } else if (!amountOk) {
    console.error(`⚠️ Monto insuficiente pago ${paymentId}: pagó ${paidAmount}, esperado ${expectedTotal}`)
  }
  return new Response(JSON.stringify({ ok: true, updated: 0, status }), { status: 200 })
})
