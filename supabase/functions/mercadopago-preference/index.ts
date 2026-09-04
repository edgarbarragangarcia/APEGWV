
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import nodemailer from "npm:nodemailer@6.9.14"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Correo "inscripción registrada — falta pago" ───────────────
const GMAIL_USER = Deno.env.get('GMAIL_USER')
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')
const APEG_NOTIFY = Deno.env.get('APEG_NOTIFY_EMAIL') || GMAIL_USER || ''
const _cop = (n: number) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO') + ' COP'
let _tx: any = null
async function sendMail(to: string, subject: string, html: string) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) { console.warn('SMTP no configurado'); return }
  if (!_tx) _tx = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } })
  try { await _tx.sendMail({ from: `"APEG · Amor por el Golf" <${GMAIL_USER}>`, to, replyTo: GMAIL_USER, subject, html }) }
  catch (e) { console.error('Error correo a', to, e) }
}
function pendingEmailHtml(d: { forApeg: boolean; eventName: string; eventDate: string; club: string; players: { name: string; email?: string; phone?: string; doc?: string; pkg: string | null; amount: number }[]; total: number; payUrl: string }) {
  const rows = d.players.map((p) => `<tr>
    <td style="padding:12px 14px;border-bottom:1px solid #1c3a29;color:#e8f5e0;font-size:14px;font-weight:600;">${p.name}${d.forApeg && p.doc ? `<br><span style="color:#7fae6d;font-size:12px;">CC ${p.doc}${p.email ? ' · ' + p.email : ''}${p.phone ? ' · ' + p.phone : ''}</span>` : ''}</td>
    <td style="padding:12px 14px;border-bottom:1px solid #1c3a29;color:#a3e635;font-size:13px;font-weight:700;">${p.pkg || 'Inscripción'}</td>
    <td style="padding:12px 14px;border-bottom:1px solid #1c3a29;color:#e8f5e0;font-size:14px;font-weight:700;text-align:right;white-space:nowrap;">${_cop(p.amount)}</td>
  </tr>`).join('')
  return `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="background:linear-gradient(135deg,#0e2f1f,#0a1f15);border:1px solid #1c3a29;border-radius:28px;overflow:hidden;">
      <div style="padding:36px 32px 18px;text-align:center;">
        <div style="display:inline-block;background:#a3e635;color:#0e2f1f;font-weight:900;font-size:12px;letter-spacing:2px;padding:6px 14px;border-radius:999px;">APEG · AMOR POR EL GOLF</div>
        <h1 style="margin:22px 0 6px;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">${d.forApeg ? 'Nueva inscripción — falta pago' : 'Ya casi… completa tu pago'}</h1>
        <p style="margin:0;color:#9fc98d;font-size:14px;line-height:1.6;">${d.forApeg ? 'Se registró una inscripción que aún no ha pagado.' : 'Tu inscripción quedó registrada. Para asegurar tu cupo solo falta completar el pago.'}</p>
      </div>
      <div style="padding:0 24px 8px;"><div style="background:#0a1f15;border:1px solid #1c3a29;border-radius:20px;padding:18px 20px;">
        <div style="color:#7fae6d;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">Evento</div>
        <div style="color:#fff;font-size:16px;font-weight:800;margin:4px 0 12px;">${d.eventName}</div>
        <table style="width:100%;"><tr><td style="color:#9fc98d;font-size:13px;">📅 ${d.eventDate || 'Por confirmar'}</td><td style="color:#9fc98d;font-size:13px;text-align:right;">📍 ${d.club || ''}</td></tr></table>
      </div></div>
      <div style="padding:16px 24px 8px;"><table style="width:100%;border-collapse:collapse;background:#0a1f15;border:1px solid #1c3a29;border-radius:20px;overflow:hidden;">
        <thead><tr style="background:#0e2f1f;"><th style="padding:12px 14px;text-align:left;color:#7fae6d;font-size:11px;text-transform:uppercase;">Participante</th><th style="padding:12px 14px;text-align:left;color:#7fae6d;font-size:11px;text-transform:uppercase;">Plan</th><th style="padding:12px 14px;text-align:right;color:#7fae6d;font-size:11px;text-transform:uppercase;">Valor</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <div style="padding:12px 24px 8px;"><div style="background:rgba(163,230,53,0.1);border:1px solid rgba(163,230,53,0.3);border-radius:20px;padding:16px 20px;">
        <table style="width:100%;border-collapse:collapse;"><tr>
          <td style="color:#9fc98d;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;vertical-align:middle;">Total a pagar</td>
          <td style="color:#a3e635;font-size:22px;font-weight:900;text-align:right;vertical-align:middle;white-space:nowrap;">${_cop(d.total)}</td>
        </tr></table>
      </div></div>
      ${d.forApeg ? '' : `<div style="text-align:center;padding:4px 24px 20px;"><a href="${d.payUrl}" style="display:inline-block;background:#a3e635;color:#0e2f1f;font-weight:900;font-size:15px;text-decoration:none;padding:15px 34px;border-radius:999px;">Completar el pago</a></div>`}
      <div style="padding:20px 32px 32px;border-top:1px solid #1c3a29;text-align:center;"><p style="margin:0;color:#7fae6d;font-size:12px;line-height:1.7;">¿Dudas? <a href="mailto:${GMAIL_USER}" style="color:#a3e635;text-decoration:none;font-weight:700;">${GMAIL_USER}</a><br>APEG · Amor por el Golf</p></div>
    </div>
  </div></body></html>`
}

// USD -> COP usando la TRM oficial del día (Superfinanciera vía datos.gov.co),
// con respaldo a open.er-api.com y a un valor fijo por Secret (USD_COP_RATE).
async function getUsdCopRate(): Promise<{ rate: number; source: string }> {
  const override = Number(Deno.env.get('USD_COP_RATE'))
  if (override > 0) return { rate: override, source: 'env:USD_COP_RATE' }

  try {
    const r = await fetch(
      'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1',
      { signal: AbortSignal.timeout(5000) },
    )
    if (r.ok) {
      const j = await r.json()
      const v = Number(j?.[0]?.valor)
      if (v > 0) return { rate: v, source: 'TRM datos.gov.co' }
    }
  } catch (_) { /* fallthrough */ }

  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) })
    if (r.ok) {
      const j = await r.json()
      const v = Number(j?.rates?.COP)
      if (v > 0) return { rate: v, source: 'open.er-api.com' }
    }
  } catch (_) { /* fallthrough */ }

  throw new Error('No se pudo obtener la TRM del día. Configura el Secret USD_COP_RATE como respaldo.')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      items,
      buyer_email,
      order_id,
      seller_id,
      // Tournament flow
      kind,
      tournament_id,
      registration_ids,
      package_id,
      return_path,
    } = body

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') // Platform Owner's Token
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!MP_ACCESS_TOKEN) {
      throw new Error('Falta MP_ACCESS_TOKEN en los Secrets de Supabase.')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const origin = req.headers.get('origin') || 'https://apeg.club'
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')

    // ─────────────────────────────────────────────────────────────
    // TOURNAMENT REGISTRATION FLOW (price computed server-side)
    // ─────────────────────────────────────────────────────────────
    if (kind === 'tournament_registration') {
      if (!tournament_id || !Array.isArray(registration_ids) || registration_ids.length === 0) {
        return json({ error: 'Datos de inscripción incompletos.' }, 400)
      }

      // Trust ONLY the database for the price and for which registrations exist.
      const { data: tournament, error: tErr } = await supabase
        .from('tournaments')
        .select('id, name, price, slug, packages, event_type')
        .eq('id', tournament_id)
        .single()
      if (tErr || !tournament) return json({ error: 'Torneo no encontrado.' }, 404)

      const { data: regs, error: rErr } = await supabase
        .from('tournament_registrations')
        .select('id, tournament_id, registration_status, mp_payment_id, package_price, payment_currency, selected_package')
        .in('id', registration_ids)
      if (rErr) throw rErr

      const validRegs = (regs || []).filter(
        (r: any) => r.tournament_id === tournament_id && !r.mp_payment_id,
      )
      if (validRegs.length === 0) {
        return json({ error: 'No hay inscripciones pendientes de pago válidas.' }, 400)
      }

      const validIds = validRegs.map((r: any) => r.id)

      // Package / room-type pricing. The price and currency come ONLY from the DB:
      // either from the chosen package, from a price already stored on the rows
      // (pay-later case), or the tournament base price.
      let packages: any[] = Array.isArray(tournament.packages) ? tournament.packages : []
      if (
        packages.length === 0 &&
        tournament.event_type === 'viaje' &&
        /buenaventura/i.test(String(tournament.name || ''))
      ) {
        packages = [
          { id: 'single', name: 'Habitación Single', price: 2100, currency: 'USD' },
          { id: 'double', name: 'Habitación Doble', price: 1900, currency: 'USD' },
        ]
      }
      let unitPrice = Math.round(Number(tournament.price) || 0)
      let currencyId = 'COP'
      let packageName = ''
      const storedRow = validRegs.find((r: any) => Number(r.package_price) > 0)
      if (packages.length > 0) {
        const pkg = packages.find((p) => String(p.id) === String(package_id))
        if (pkg) {
          unitPrice = Math.round(Number(pkg.price) || 0)
          currencyId = String(pkg.currency || 'USD').toUpperCase()
          packageName = String(pkg.name || pkg.id || '')
        } else if (storedRow) {
          unitPrice = Math.round(Number(storedRow.package_price) || 0)
          currencyId = String(storedRow.payment_currency || 'USD').toUpperCase()
          packageName = String(storedRow.selected_package || '')
        } else {
          unitPrice = Math.round(Number(packages[0].price) || 0)
          currencyId = String(packages[0].currency || 'USD').toUpperCase()
          packageName = String(packages[0].name || packages[0].id || '')
        }
      } else if (storedRow) {
        unitPrice = Math.round(Number(storedRow.package_price) || 0)
        currencyId = String(storedRow.payment_currency || 'COP').toUpperCase()
      }
      if (unitPrice <= 0) return json({ error: 'Este torneo no tiene un precio válido.' }, 400)

      // El cobro SIEMPRE se hace en COP. Si el paquete está en USD se convierte
      // con la TRM del día y se congela el valor en COP en la inscripción, para
      // que el webhook valide contra ese mismo monto aunque la TRM cambie.
      let fxRate = 0
      let fxSource = ''
      let usdAmount = 0
      if (currencyId === 'USD') {
        const fx = await getUsdCopRate()
        fxRate = fx.rate
        fxSource = fx.source
        usdAmount = unitPrice
        unitPrice = Math.round(unitPrice * fxRate)
        currencyId = 'COP'
      }

      const reference = `tourn_${tournament_id}_${Date.now()}`

      // Stamp the reference + resolved package so the webhook can verify the
      // amount later even if Mercado Pago drops the metadata.
      await supabase
        .from('tournament_registrations')
        .update({
          mp_reference: reference,
          selected_package: packageName || null,
          package_price: unitPrice,
          payment_currency: currencyId,
        })
        .in('id', validIds)

      const path = typeof return_path === 'string' && return_path.startsWith('/')
        ? return_path
        : `/tournament-register/${tournament.slug || tournament_id}`

      const payload: any = {
        items: [{
          id: String(tournament_id),
          title: `Inscripción · ${String(tournament.name).substring(0, 160)}${packageName ? ' · ' + packageName : ''}`,
          description: `${validIds.length} inscripción(es)${packageName ? ' — ' + packageName : ''}` +
            (usdAmount ? ` · USD ${usdAmount} x TRM ${Math.round(fxRate)}` : ''),
          unit_price: unitPrice,
          quantity: validIds.length,
          currency_id: currencyId,
        }],
        back_urls: {
          success: `${origin}${path}?mp=1&ref=${reference}`,
          failure: `${origin}${path}?mp=1&ref=${reference}`,
          pending: `${origin}${path}?mp=1&ref=${reference}`,
        },
        external_reference: reference,
        metadata: {
          kind: 'tournament_registration',
          tournament_id,
          registration_ids: validIds,
          reference,
          package_id: package_id ?? null,
          package_name: packageName || null,
          currency: currencyId,
          unit_price: unitPrice,
          expected_total: unitPrice * validIds.length,
          usd_amount: usdAmount || null,
          trm: fxRate || null,
          trm_source: fxSource || null,
        },
        payer: buyer_email && buyer_email.includes('@') ? { email: buyer_email } : undefined,
        statement_descriptor: 'APEG GOLF',
        binary_mode: true, // no "pending" limbo: approved or rejected only
        theme: { header_color: '#0e2f1f', elements_color: '#a3e635' },
      }
      if (!isLocalhost) payload.auto_return = 'approved'

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const mpData = await mpResponse.json()
      if (!mpResponse.ok) {
        console.error('❌ MP preference error:', JSON.stringify(mpData))
        return json({ error: mpData.message || 'Error de Mercado Pago', raw: mpData }, 400)
      }

      const initPoint: string = mpData.init_point || mpData.sandbox_init_point || ''

      // Correo "inscripción registrada — falta pago" en segundo plano (no bloquea el redirect).
      const _emailTask = (async () => {
        try {
          const { data: rows } = await supabase
            .from('tournament_registrations')
            .select('player_name, player_email, player_phone, player_document')
            .in('id', validIds)
          const players = (rows || []).map((r: any) => ({
            name: r.player_name || 'Participante',
            email: (r.player_email || '').trim(),
            phone: (r.player_phone || '').trim(),
            doc: (r.player_document || '').trim(),
            pkg: packageName || null,
            amount: unitPrice,
          }))
          const emailData = {
            eventName: tournament.name || 'Evento APEG',
            eventDate: tournament.date ? new Date(tournament.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '',
            club: tournament.club || '',
            players,
            total: unitPrice * validIds.length,
            trm: fxRate || null,
            usdTotal: usdAmount ? usdAmount * validIds.length : null,
            payUrl: initPoint,
          }
          const buyers = [...new Set(players.map((p) => p.email).filter((e) => e.includes('@')))]
          for (const email of buyers) {
            await sendMail(email, `📝 Inscripción registrada · ${emailData.eventName}`, pendingEmailHtml({ ...emailData, forApeg: false }))
          }
          if (APEG_NOTIFY.includes('@')) {
            await sendMail(APEG_NOTIFY, `📝 Nueva inscripción (falta pago) · ${emailData.eventName}`, pendingEmailHtml({ ...emailData, forApeg: true }))
          }
        } catch (e) {
          console.error('Fallo enviando correo de inscripción:', e)
        }
      })()
      try { (globalThis as any).EdgeRuntime?.waitUntil?.(_emailTask) } catch { /* noop */ }

      return json({ init_point: mpData.init_point, sandbox_init_point: mpData.sandbox_init_point, reference }, 200)
    }

    // ─────────────────────────────────────────────────────────────
    // LEGACY STORE / MARKETPLACE FLOW (unchanged)
    // ─────────────────────────────────────────────────────────────
    let sellerMpToken = null
    let marketplaceFee = 0

    if (seller_id && seller_id !== 'admin') {
      const { data: sellerProfile } = await supabase
        .from('seller_profiles')
        .select('mp_access_token, mp_user_id, mp_connected')
        .eq('user_id', seller_id)
        .single()

      if (sellerProfile?.mp_connected && sellerProfile?.mp_access_token) {
        sellerMpToken = sellerProfile.mp_access_token
        const totalAmount = items.reduce((acc: number, item: any) => acc + (Number(item.price) * (item.quantity || 1)), 0)
        marketplaceFee = Math.round(totalAmount * 0.10)
      }
    }

    const formattedItems = items.map((item: any) => ({
      id: String(item.id || 'product-' + Date.now()),
      title: String(item.name || 'Producto').substring(0, 250),
      unit_price: Math.round(Number(item.price || 0)),
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      currency_id: "COP"
    }))

    const payload: any = {
      items: formattedItems,
      back_urls: {
        success: `${origin}/checkout?status=success&order_id=${order_id}`,
        failure: `${origin}/checkout?status=failure&order_id=${order_id}`,
        pending: `${origin}/checkout?status=pending&order_id=${order_id}`,
      },
      external_reference: String(order_id),
      payer: { email: buyer_email },
      statement_descriptor: 'APEG GOLF',
      theme: { header_color: '#0e2f1f', elements_color: '#a3e635' }
    }
    if (!isLocalhost) payload.auto_return = 'approved'
    if (marketplaceFee > 0) payload.marketplace_fee = marketplaceFee

    const tokenToUse = sellerMpToken || MP_ACCESS_TOKEN
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenToUse}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const mpData = await mpResponse.json()
    if (!mpResponse.ok) {
      console.error('❌ Mercado Pago Detailed Error:', JSON.stringify(mpData, null, 2))
      return json({ error: mpData.message || 'Error de Mercado Pago', details: mpData.code || 'Unauthorized', raw: mpData }, 400)
    }
    return json(mpData, 200)

  } catch (error) {
    console.error('Edge Function Error:', error)
    return json({ error: (error as Error).message }, 400)
  }

  function json(data: unknown, status: number) {
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    })
  }
})
