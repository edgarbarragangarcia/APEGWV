
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Verificación de pago al regresar de Mercado Pago (sin webhook).
// Consulta el pago real en MP con MP_ACCESS_TOKEN, valida estado y monto
// contra el precio congelado en la inscripción, y actualiza el estado.
// - approved  -> registration_status = 'paid'
// - rejected/cancelled -> registration_status = 'Rechazado'
// - resto -> se deja 'Pendiente'
// Siempre registra mp_status / mp_status_detail / mp_amount para la contabilidad.

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
    const latest = approved || payments[0]
    if (!latest) return json({ status: "not_found", updated: 0 })

    const ref: string = latest.external_reference || latest.metadata?.reference || reference || ""
    if (!ref.startsWith("tourn_")) return json({ status: "ignored", updated: 0 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const meta = latest.metadata || {}
    const regIds: string[] = Array.isArray(meta.registration_ids) ? meta.registration_ids : []

    let q = supabase
      .from("tournament_registrations")
      .select("id, registration_status, mp_payment_id, package_price, tournament_id")
    q = regIds.length > 0 ? q.in("id", regIds) : q.eq("mp_reference", ref)
    const { data: regs, error } = await q
    if (error) return json({ error: error.message }, 500)
    if (!regs || regs.length === 0) return json({ status: "no_regs", updated: 0 })

    const mpStatus: string = latest.status || "unknown"
    const mpDetail: string = latest.status_detail || ""
    const mpAmount = Number(latest.transaction_amount) || 0

    // Contabilidad: registra siempre el último estado de MP en todas las filas.
    const meta_fields: Record<string, unknown> = {
      mp_status: mpStatus,
      mp_status_detail: mpDetail,
      mp_amount: mpAmount,
    }
    await supabase
      .from("tournament_registrations")
      .update(meta_fields)
      .in("id", regs.map((r: any) => r.id))
      .is("mp_payment_id", null)

    const alreadyPaid = regs.every((r: any) => r.mp_payment_id)
    if (alreadyPaid) return json({ status: "approved", updated: 0, already: true })

    const pending = regs.filter((r: any) => !r.mp_payment_id)

    // Pago rechazado / cancelado -> marca 'Rechazado' para que se vea en el admin.
    if (mpStatus === "rejected" || mpStatus === "cancelled") {
      await supabase
        .from("tournament_registrations")
        .update({ registration_status: "Rechazado" })
        .in("id", pending.map((r: any) => r.id))
        .is("mp_payment_id", null)
      return json({ status: mpStatus, detail: mpDetail, updated: 0 })
    }

    if (!approved) return json({ status: mpStatus, updated: 0 })

    // Verificación de monto contra el precio congelado.
    const { data: tournament } = await supabase
      .from("tournaments").select("price").eq("id", regs[0].tournament_id).single()
    const stored = pending.find((r: any) => Number(r.package_price) > 0)?.package_price
    const unitPrice = Math.round(Number(stored ?? tournament?.price) || 0)
    const expected = unitPrice * pending.length
    if (unitPrice <= 0 || mpAmount + 1 < expected) {
      return json({ status: "amount_mismatch", updated: 0, paid: mpAmount, expected })
    }

    const { data: upd, error: upErr } = await supabase
      .from("tournament_registrations")
      .update({
        registration_status: "paid",
        payment_date: new Date().toISOString(),
        mp_payment_id: String(approved.id),
        mp_status: "approved",
        mp_status_detail: approved.status_detail || "accredited",
        mp_amount: mpAmount,
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
