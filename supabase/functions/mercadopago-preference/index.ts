
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
    const { items, buyer_email, order_id, seller_id } = await req.json()
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') // Platform Owner's Token
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!MP_ACCESS_TOKEN) {
      throw new Error('Falta MP_ACCESS_TOKEN en los Secrets de Supabase.')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch seller's MP info if seller_id is provided
    let sellerMpToken = null
    let sellerMpUserId = null
    let marketplaceFee = 0

    if (seller_id && seller_id !== 'admin') {
      const { data: sellerProfile } = await supabase
        .from('seller_profiles')
        .select('mp_access_token, mp_user_id, mp_connected')
        .eq('user_id', seller_id)
        .single()

      if (sellerProfile?.mp_connected && sellerProfile?.mp_access_token) {
        sellerMpToken = sellerProfile.mp_access_token
        sellerMpUserId = sellerProfile.mp_user_id
        
        // Calculate marketplace fee (e.g., 10%)
        const totalAmount = items.reduce((acc: number, item: any) => acc + (Number(item.price) * (item.quantity || 1)), 0)
        marketplaceFee = Math.round(totalAmount * 0.10) // 10% commission
      }
    }

    // Format items for MP
    const formattedItems = items.map((item: any) => ({
      id: String(item.id || 'product-' + Date.now()),
      title: String(item.name || 'Producto').substring(0, 250),
      unit_price: Math.round(Number(item.price || 0)),
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      currency_id: "COP"
    }))

    const origin = req.headers.get('origin') || 'https://apeg.club'
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')

    const payload: any = {
      items: formattedItems,
      back_urls: {
        success: `${origin}/checkout?status=success&order_id=${order_id}`,
        failure: `${origin}/checkout?status=failure&order_id=${order_id}`,
        pending: `${origin}/checkout?status=pending&order_id=${order_id}`,
      },
      external_reference: String(order_id),
      payer: {
        email: (buyer_email && buyer_email.includes('@')) ? buyer_email : 'test_user_123@test.com'
      },
      statement_descriptor: 'APEG GOLF',
      theme: {
        header_color: '#0e2f1f',
        elements_color: '#a3e635'
      }
    }

    if (!isLocalhost) {
      payload.auto_return = 'approved'
    }

    // Split Payment Logic
    // If we have a seller with a linked account, we create the preference using the platform token
    // but specifying the marketplace_fee. 
    // IMPORTANT: For marketplace_fee to work, the preference must be created with the platform token
    // AND the seller must have authorized the platform's APP.
    if (marketplaceFee > 0) {
      payload.marketplace_fee = marketplaceFee
      // Note: We create this preference with the Platform Token, 
      // but MP knows who the seller is because we specify the collector_id if needed,
      // or we use the seller's token.
      // In Mercado Pago Marketplace, you usually use your platform token to create
      // the preference on behalf of the seller by providing his access token in the header.
    }

    const tokenToUse = sellerMpToken || MP_ACCESS_TOKEN

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenToUse}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const mpData = await mpResponse.json()
    
    if (!mpResponse.ok) {
        console.error('❌ Mercado Pago Error:', mpData)
        return new Response(JSON.stringify({ error: mpData.message, details: mpData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
    }

    return new Response(JSON.stringify(mpData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
