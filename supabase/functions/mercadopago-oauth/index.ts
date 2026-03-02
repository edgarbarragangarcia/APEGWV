import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, seller_profile_id } = await req.json();

    if (!code || !seller_profile_id) {
      throw new Error("Missing code or seller_profile_id");
    }

    const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID");
    const MP_CLIENT_SECRET = Deno.env.get("MP_CLIENT_SECRET");
    const MP_REDIRECT_URI = Deno.env.get("MP_REDIRECT_URI");

    if (!MP_CLIENT_ID || !MP_CLIENT_SECRET || !MP_REDIRECT_URI) {
        throw new Error("Mercado Pago configuration missing in environment variables");
    }

    // Exchange code for tokens
    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        client_id: MP_CLIENT_ID,
        client_secret: MP_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: MP_REDIRECT_URI,
      }),
    });

    const tokenData = await response.json();

    if (!response.ok) {
        console.error("MP OAuth Error:", tokenData);
        throw new Error(tokenData.message || "Failed to exchange code for tokens");
    }

    // Update seller_profiles in Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseClient
      .from("seller_profiles")
      .update({
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_user_id: tokenData.user_id.toString(),
        mp_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", seller_profile_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: "Account connected successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("OAuth edge function error:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
