import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Nequi API URLs (Production)
const NEQUI_AUTH_URL = 'https://oauth.nequi.com/oauth2/token'
const NEQUI_API_URL = 'https://api.nequi.com/payments/v2/-services-paymentservice-unregisteredpayment'
const NEQUI_STATUS_URL = 'https://api.nequi.com/payments/v2/-services-paymentservice-getstatuspayment'

/**
 * Get OAuth2 token from Nequi
 */
async function getNequiToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`)
  
  const response = await fetch(NEQUI_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Nequi Auth Error:', errorData)
    throw new Error('Error al autenticar con Nequi')
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Send Push Notification Payment to Nequi user
 */
async function sendPushPayment(
  token: string, 
  apiKey: string, 
  phoneNumber: string, 
  amount: number, 
  orderId: string,
  merchantName: string
) {
  const transactionId = `APEG-${orderId}-${Date.now()}`
  
  const payload = {
    RequestMessage: {
      RequestHeader: {
        Channel: 'PNP04',
        RequestDate: new Date().toISOString(),
        MessageID: transactionId,
        ClientID: apiKey,
        Destination: {
          ServiceName: 'PaymentsService',
          ServiceOperation: 'unregisteredPayment',
          ServiceRegion: 'C001',
          ServiceVersion: '1.2.0',
        },
      },
      RequestBody: {
        any: {
          unregisteredPaymentRQ: {
            phoneNumber: phoneNumber,
            code: 'NIT_1',
            value: String(amount),
            reference1: orderId,
            reference2: merchantName,
            reference3: transactionId,
          },
        },
      },
    },
  }

  const response = await fetch(NEQUI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  
  if (!response.ok) {
    console.error('Nequi Push Error:', JSON.stringify(data, null, 2))
    throw new Error(data?.ResponseMessage?.ResponseBody?.any?.unregisteredPaymentRS?.description || 'Error al enviar notificación Nequi')
  }

  return {
    transactionId,
    status: data?.ResponseMessage?.ResponseBody?.any?.unregisteredPaymentRS?.status || 'PENDING',
    data,
  }
}

/**
 * Check payment status
 */
async function checkPaymentStatus(
  token: string,
  apiKey: string,
  transactionId: string
) {
  const payload = {
    RequestMessage: {
      RequestHeader: {
        Channel: 'PNP04',
        RequestDate: new Date().toISOString(),
        MessageID: `STATUS-${Date.now()}`,
        ClientID: apiKey,
        Destination: {
          ServiceName: 'PaymentsService',
          ServiceOperation: 'getStatusPayment',
          ServiceRegion: 'C001',
          ServiceVersion: '1.2.0',
        },
      },
      RequestBody: {
        any: {
          getStatusPaymentRQ: {
            codeQR: transactionId,
          },
        },
      },
    },
  }

  const response = await fetch(NEQUI_STATUS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  
  return {
    status: data?.ResponseMessage?.ResponseBody?.any?.getStatusPaymentRS?.status || 'UNKNOWN',
    data,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, phone_number, amount, order_id, transaction_id } = await req.json()
    
    const NEQUI_CLIENT_ID = Deno.env.get('NEQUI_CLIENT_ID')
    const NEQUI_CLIENT_SECRET = Deno.env.get('NEQUI_CLIENT_SECRET')
    const NEQUI_API_KEY = Deno.env.get('NEQUI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!NEQUI_CLIENT_ID || !NEQUI_CLIENT_SECRET || !NEQUI_API_KEY) {
      throw new Error('Faltan credenciales de Nequi en los Secrets de Supabase. Configura NEQUI_CLIENT_ID, NEQUI_CLIENT_SECRET y NEQUI_API_KEY.')
    }

    // 1. Authenticate with Nequi
    const token = await getNequiToken(NEQUI_CLIENT_ID, NEQUI_CLIENT_SECRET)

    if (action === 'push') {
      // 2. Send push notification
      if (!phone_number || !amount || !order_id) {
        throw new Error('Se requieren phone_number, amount y order_id')
      }

      const result = await sendPushPayment(
        token,
        NEQUI_API_KEY,
        phone_number,
        Math.round(amount),
        order_id,
        'APEG Golf'
      )

      // Update order with transaction ID
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
      await supabase
        .from('orders')
        .update({ 
          status: 'Esperando Aprobación Nequi',
        } as any)
        .eq('id', order_id)

      return new Response(JSON.stringify({
        success: true,
        transaction_id: result.transactionId,
        status: result.status,
        message: 'Notificación enviada. El usuario debe aprobar el pago en su app de Nequi.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (action === 'status') {
      // 3. Check payment status
      if (!transaction_id) {
        throw new Error('Se requiere transaction_id para consultar el estado')
      }

      const result = await checkPaymentStatus(token, NEQUI_API_KEY, transaction_id)

      // Update order status if payment was successful
      if (result.status === '35' || result.status === 'APPROVED' || result.status === 'SUCCESS') {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        await supabase
          .from('orders')
          .update({ status: 'Pagado' } as any)
          .eq('id', order_id)
      }

      return new Response(JSON.stringify({
        success: true,
        status: result.status,
        data: result.data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else {
      throw new Error('Acción no reconocida. Usa "push" o "status".')
    }

  } catch (error) {
    console.error('Nequi Edge Function Error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
