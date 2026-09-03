
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        .select('id, name, price, slug')
        .eq('id', tournament_id)
        .single()
      if (tErr || !tournament) return json({ error: 'Torneo no encontrado.' }, 404)

      const unitPrice = Math.round(Number(tournament.price) || 0)
      if (unitPrice <= 0) return json({ error: 'Este torneo no tiene un precio válido.' }, 400)

      const { data: regs, error: rErr } = await supabase
        .from('tournament_registrations')
        .select('id, tournament_id, registration_status, mp_payment_id')
        .in('id', registration_ids)
      if (rErr) throw rErr

      const validRegs = (regs || []).filter(
        (r: any) => r.tournament_id === tournament_id && !r.mp_payment_id,
      )
      if (validRegs.length === 0) {
        return json({ error: 'No hay inscripciones pendientes de pago válidas.' }, 400)
      }

      const validIds = validRegs.map((r: any) => r.id)
      const reference = `tourn_${tournament_id}_${Date.now()}`

      // Stamp the reference so the webhook can find these rows even if
      // Mercado Pago drops the metadata.
      await supabase
        .from('tournament_registrations')
        .update({ mp_reference: reference })
        .in('id', validIds)

      const path = typeof return_path === 'string' && return_path.startsWith('/')
        ? return_path
        : `/tournament-register/${tournament.slug || tournament_id}`

      const payload: any = {
        items: [{
          id: String(tournament_id),
          title: `Inscripción · ${String(tournament.name).substring(0, 200)}`,
          description: `${validIds.length} inscripción(es)`,
          unit_price: unitPrice,
          quantity: validIds.length,
          currency_id: 'COP',
        }],
        back_urls: {
          success: `${origin}${path}?status=success&ref=${reference}`,
          failure: `${origin}${path}?status=failure&ref=${reference}`,
          pending: `${origin}${path}?status=pending&ref=${reference}`,
        },
        external_reference: reference,
        notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
        metadata: {
          kind: 'tournament_registration',
          tournament_id,
          registration_ids: validIds,
          reference,
          expected_total: unitPrice * validIds.length,
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
