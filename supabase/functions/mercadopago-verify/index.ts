
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// ─────────────────────────────────────────────────────────────────────────────
// Verificación de pago al regresar de Mercado Pago (sin webhook).
//
// El navegador vuelve de MP con ?payment_id=... o con ?ref=<reference>.
// Esta función:
//  1. Consulta el pago REAL en la API de MP con MP_ACCESS_TOKEN (nunca confía
//     en los parámetros del navegador para el estado ni el monto).
//  2. Solo marca "paid" si status === 'approved', el external_reference
//     corresponde a inscripciones nuestras, y el monto cubre el precio que la
//     función de preferencia ya congeló en cada fila (package_price).
//  3. Es idempotente: una fila ya con mp_payment_id no se toca.
//
// Es tan seguro como un webhook: un atacante necesitaría un pago aprobado real
// en MP con NUESTRO external_reference (que solo crea mercadopago-preference).
// ─────────────────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  })
}

async function mpGet(path: string) {
  const r = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  })
  return r.ok ? await r.json() : null
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (!MP_ACCESS_TOKEN) return json({ error: "Falta MP_ACCESS_TOKEN" }, 500)

  try {
    const { payment_id, reference } = await req.json()

    // 1. Resolver el/los pagos a revisar.
    let payments: any[] = []
    if (payment_id) {
      const p = await mpGet(`/v1/payments/${payment_id}`)
      if (p) payments = [p]
    } else if (reference) {
      const search = await mpGet(
        `/v1/payments/search?external_reference=${encodeURIComponent(reference)}&sort=date_created&criteria=desc`,
      )
      payments = search?.results || []
    } else {
      return json({ error: "Falta payment_id o reference." }, 400)
    }

    const approved = payments.find((p) => p.status === "approved")
    const anyPayment = approved || payments[0]
    if (!anyPayment) return json({ status: "not_found", updated: 0 })

    const ref: string = anyPayment.external_reference || anyPayment.metadata?.reference || reference || ""
    if (!ref.startsWith("tourn_")) return json({ status: "ignored", updated: 0 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const meta = anyPayment.metadata || {}
    const regIds: string[] = Array.isArray(meta.registration_ids) ? meta.registration_ids : []

    let q = supabase
      .from("tournament_registrations")
      .select("id, registration_status, mp_payment_id, package_price, tournament_id")
    q = regIds.length > 0 ? q.in("id", regIds) : q.eq("mp_reference", ref)
    const { data: regs, error } = await q
    if (error) return json({ error: error.message }, 500)
    if (!regs || regs.length === 0) return json({ status: "no_regs", updated: 0 })

    const alreadyPaid = regs.every((r: any) => r.mp_payment_id)
    if (alreadyPaid) return json({ status: "approved", updated: 0, already: true })

    if (!approved) {
      return json({ status: anyPayment.status || "pending", updated: 0 })
    }

    // 2. Verificar el monto contra el precio congelado en nuestras filas.
    const pending = regs.filter((r: any) => !r.mp_payment_id)
    const { data: tournament } = await supabase
      .from("tournaments").select("price").eq("id", regs[0].tournament_id).single()
    const stored = pending.find((r: any) => Number(r.package_price) > 0)?.package_price
    const unitPrice = Math.round(Number(stored ?? tournament?.price) || 0)
    const expected = unitPrice * pending.length
    const paid = Number(approved.transaction_amount) || 0
    if (unitPrice <= 0 || paid + 1 < expected) {
      return json({ status: "amount_mismatch", updated: 0, paid, expected })
    }

    // 3. Marcar pagado (idempotente).
    const { data: upd, error: upErr } = await supabase
      .from("tournament_registrations")
      .update({
        registration_status: "paid",
        payment_date: new Date().toISOString(),
        mp_payment_id: String(approved.id),
      })
      .in("id", pending.map((r: any) => r.id))
      .is("mp_payment_id", null)
      .select("id")
    if (upErr) return json({ error: upErr.message }, 500)

    return json({ status: "approved", updated: upd?.length || 0 })
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
})
