
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import nodemailer from "npm:nodemailer@6.9.14"

// Verificación de pago al regresar de Mercado Pago (sin webhook).
// - approved            -> registration_status = 'paid'       + correo de confirmación
// - rejected/cancelled  -> registration_status = 'Rechazado'  + correo de rechazo
// - resto               -> se deja como está (pendiente)
// Registra mp_status / mp_status_detail / mp_amount para la contabilidad.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const GMAIL_USER = Deno.env.get("GMAIL_USER")
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")
const APEG_NOTIFY = Deno.env.get("APEG_NOTIFY_EMAIL") || GMAIL_USER || ""

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status })
}

async function mpGet(path: string) {
  const r = await fetch(`https://api.mercadopago.com${path}`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
  return r.ok ? await r.json() : null
}

const cop = (n: number) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CO") + " COP"
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : ""

let transporter: any = null
function getTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    })
  }
  return transporter
}
async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter()
  if (!t) { console.warn("SMTP no configurado (GMAIL_USER / GMAIL_APP_PASSWORD)"); return }
  try {
    await t.sendMail({ from: `"APEG · Amor por el Golf" <${GMAIL_USER}>`, to, replyTo: GMAIL_USER, subject, html })
  } catch (e) { console.error("Error enviando correo a", to, e) }
}

interface EmailData {
  kind: "confirmed" | "rejected"
  forApeg: boolean
  eventName: string; eventDate: string; club: string
  players: { name: string; pkg: string | null; amount: number; doc?: string; email?: string; phone?: string }[]
  total: number; trm?: number | null; usdTotal?: number | null; paymentId?: string; payUrl?: string; reason?: string
}
function buildEmail(d: EmailData) {
  const heading = d.forApeg
    ? (d.kind === "confirmed" ? "Nueva inscripción pagada" : "Pago rechazado")
    : (d.kind === "confirmed" ? "¡Pago confirmado!" : "El pago no se pudo procesar")
  const intro = d.forApeg
    ? (d.kind === "confirmed" ? "Se acreditó un pago por Mercado Pago." : "Mercado Pago rechazó un pago. La inscripción sigue pendiente.")
    : (d.kind === "confirmed" ? "Tu inscripción quedó confirmada. ¡Nos vemos en el campo! ⛳"
      : "Tu inscripción quedó registrada, pero el pago fue rechazado. Puedes intentarlo de nuevo cuando quieras.")
  const accent = d.kind === "rejected" ? "#ef4444" : "#a3e635"
  const rows = d.players.map((p) => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #1c3a29;color:#e8f5e0;font-size:14px;font-weight:600;">
        ${p.name}${d.forApeg && p.doc ? `<br><span style="color:#7fae6d;font-size:12px;font-weight:400;">CC ${p.doc}</span>` : ""}${d.forApeg && p.email ? `<br><span style="color:#7fae6d;font-size:12px;font-weight:400;">${p.email}${p.phone ? " · " + p.phone : ""}</span>` : ""}
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #1c3a29;color:#a3e635;font-size:13px;font-weight:700;">${p.pkg || "Inscripción"}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1c3a29;color:#e8f5e0;font-size:14px;font-weight:700;text-align:right;white-space:nowrap;">${cop(p.amount)}</td>
    </tr>`).join("")
  const cta = (!d.forApeg && d.payUrl && d.kind === "rejected")
    ? `<div style="text-align:center;padding:4px 24px 20px;"><a href="${d.payUrl}" style="display:inline-block;background:#a3e635;color:#0e2f1f;font-weight:900;font-size:15px;text-decoration:none;padding:15px 34px;border-radius:999px;">Reintentar el pago</a></div>` : ""
  return `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="background:linear-gradient(135deg,#0e2f1f,#0a1f15);border:1px solid #1c3a29;border-radius:28px;overflow:hidden;">
      <div style="padding:36px 32px 20px;text-align:center;">
        <div style="display:inline-block;background:${accent};color:#0e2f1f;font-weight:900;font-size:12px;letter-spacing:2px;padding:6px 14px;border-radius:999px;">APEG · AMOR POR EL GOLF</div>
        <h1 style="margin:22px 0 6px;color:#fff;font-size:25px;font-weight:900;letter-spacing:-0.5px;">${heading}</h1>
        <p style="margin:0;color:#9fc98d;font-size:14px;line-height:1.6;">${intro}</p>
        ${d.reason ? `<p style="margin:8px 0 0;color:#ef9a9a;font-size:12px;">Motivo: ${d.reason}</p>` : ""}
      </div>
      <div style="padding:0 24px 8px;"><div style="background:#0a1f15;border:1px solid #1c3a29;border-radius:20px;padding:18px 20px;">
        <div style="color:#7fae6d;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">Evento</div>
        <div style="color:#fff;font-size:16px;font-weight:800;margin:4px 0 12px;">${d.eventName}</div>
        <table style="width:100%;border-collapse:collapse;"><tr>
          <td style="color:#9fc98d;font-size:13px;">📅 ${d.eventDate || "Por confirmar"}</td>
          <td style="color:#9fc98d;font-size:13px;text-align:right;">📍 ${d.club || ""}</td>
        </tr></table>
      </div></div>
      <div style="padding:16px 24px 8px;"><table style="width:100%;border-collapse:collapse;background:#0a1f15;border:1px solid #1c3a29;border-radius:20px;overflow:hidden;">
        <thead><tr style="background:#0e2f1f;">
          <th style="padding:12px 14px;text-align:left;color:#7fae6d;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Participante</th>
          <th style="padding:12px 14px;text-align:left;color:#7fae6d;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Plan</th>
          <th style="padding:12px 14px;text-align:right;color:#7fae6d;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Valor</th>
        </tr></thead><tbody>${rows}</tbody>
      </table></div>
      <div style="padding:12px 24px ${cta ? "8px" : "24px"};">
        <div style="background:linear-gradient(135deg,rgba(163,230,53,0.12),rgba(163,230,53,0.04));border:1px solid rgba(163,230,53,0.3);border-radius:20px;padding:16px 20px;">
          <table style="width:100%;border-collapse:collapse;"><tr>
            <td style="color:#9fc98d;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;vertical-align:middle;">${d.kind === "confirmed" ? "Total pagado" : "Total a pagar"}</td>
            <td style="color:#a3e635;font-size:22px;font-weight:900;text-align:right;vertical-align:middle;white-space:nowrap;">${cop(d.total)}</td>
          </tr></table>
        </div>
        ${d.usdTotal && d.trm ? `<p style="margin:10px 4px 0;color:#7fae6d;font-size:11px;text-align:right;">USD ${d.usdTotal.toLocaleString()} · TRM ${Math.round(d.trm).toLocaleString("es-CO")}</p>` : ""}
        ${d.paymentId ? `<p style="margin:10px 4px 0;color:#5c7a4d;font-size:11px;text-align:right;">Ref. Mercado Pago: ${d.paymentId}</p>` : ""}
      </div>
      ${cta}
      <div style="padding:20px 32px 32px;border-top:1px solid #1c3a29;text-align:center;">
        <p style="margin:0;color:#7fae6d;font-size:12px;line-height:1.7;">¿Dudas? Escríbenos a <a href="mailto:${GMAIL_USER}" style="color:#a3e635;text-decoration:none;font-weight:700;">${GMAIL_USER}</a><br>APEG · Amor por el Golf</p>
      </div>
    </div>
  </div></body></html>`
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
      const search = await mpGet(`/v1/payments/search?external_reference=${encodeURIComponent(reference)}&sort=date_created&criteria=desc`)
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

    await supabase
      .from("tournament_registrations")
      .update({ mp_status: mpStatus, mp_status_detail: mpDetail, mp_amount: mpAmount })
      .in("id", regs.map((r: any) => r.id))
      .is("mp_payment_id", null)

    if (regs.every((r: any) => r.mp_payment_id)) return json({ status: "approved", updated: 0, already: true })

    const pending = regs.filter((r: any) => !r.mp_payment_id)
    const { data: tournament } = await supabase
      .from("tournaments").select("price, name, date, club, slug").eq("id", regs[0].tournament_id).single()

    const buildData = async (kind: "confirmed" | "rejected", ids: string[]) => {
      const { data: rows } = await supabase
        .from("tournament_registrations")
        .select("player_name, player_email, player_phone, player_document, selected_package, package_price, mp_amount")
        .in("id", ids)
      const players = (rows || []).map((r: any) => ({
        name: r.player_name || "Participante",
        email: (r.player_email || "").trim(),
        phone: (r.player_phone || "").trim(),
        doc: (r.player_document || "").trim(),
        pkg: r.selected_package || null,
        amount: Number(r.mp_amount) || Number(r.package_price) || Math.round(Number(tournament?.price) || 0),
      }))
      return {
        kind, eventName: tournament?.name || "Evento APEG", eventDate: fmtDate(tournament?.date), club: tournament?.club || "",
        players, total: players.reduce((a: number, p: any) => a + p.amount, 0) || mpAmount,
        trm: Number(meta.trm) || null,
        usdTotal: Number(meta.usd_amount) ? Number(meta.usd_amount) * players.length : null,
        paymentId: String(latest.id),
        payUrl: `https://apegwv.vercel.app/tournament-register/${tournament?.slug || regs[0].tournament_id}`,
        reason: kind === "rejected" ? mpDetail : undefined,
      }
    }
    const notifyBg = (fn: () => Promise<void>) => {
      const p = fn().catch((e) => console.error("correo:", e))
      try { (globalThis as any).EdgeRuntime?.waitUntil?.(p) } catch { /* noop */ }
    }

    if (mpStatus === "rejected" || mpStatus === "cancelled") {
      await supabase.from("tournament_registrations")
        .update({ registration_status: "Rechazado" })
        .in("id", pending.map((r: any) => r.id)).is("mp_payment_id", null)
      notifyBg(async () => {
        const d = await buildData("rejected", pending.map((r: any) => r.id))
        for (const email of [...new Set(d.players.map((p) => p.email).filter((e) => e.includes("@")))])
          await sendMail(email, `⚠️ Pago rechazado · ${d.eventName}`, buildEmail({ ...d, forApeg: false }))
        if (APEG_NOTIFY.includes("@")) await sendMail(APEG_NOTIFY, `⚠️ Pago rechazado · ${d.eventName}`, buildEmail({ ...d, forApeg: true }))
      })
      return json({ status: mpStatus, detail: mpDetail, updated: 0 })
    }

    if (!approved) return json({ status: mpStatus, updated: 0 })

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

    const updatedCount = upd?.length || 0
    if (updatedCount > 0) {
      notifyBg(async () => {
        const d = await buildData("confirmed", (upd || []).map((r: any) => r.id))
        for (const email of [...new Set(d.players.map((p) => p.email).filter((e) => e.includes("@")))])
          await sendMail(email, `✅ Inscripción confirmada · ${d.eventName}`, buildEmail({ ...d, forApeg: false }))
        if (APEG_NOTIFY.includes("@")) await sendMail(APEG_NOTIFY, `💚 Nueva inscripción pagada · ${d.eventName}`, buildEmail({ ...d, forApeg: true }))
      })
    }

    return json({ status: "approved", updated: updatedCount })
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
})
