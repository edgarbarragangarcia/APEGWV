// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as jwt from "https://deno.land/x/djwt@v2.8/mod.ts";

const apnsKeyId = Deno.env.get("APNS_KEY_ID") || "";
const apnsTeamId = Deno.env.get("APNS_TEAM_ID") || "";
const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID") || "com.antigravity.APEGWV"; // Reemplaza con tu Bundle ID real si es diferente
const apnsAuthKeyBase64 = Deno.env.get("APNS_AUTH_KEY_BASE64") || "";
const isProduction = Deno.env.get("APNS_IS_PRODUCTION") === "true";

// Helper function to decode base64 string to ArrayBuffer for crypto operations
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Generate the JWT required by APNs
async function generateAPNsToken() {
  if (!apnsAuthKeyBase64 || !apnsKeyId || !apnsTeamId) {
    throw new Error("Missing APNs configuration secrets.");
  }

  // Convert the base64 .p8 file back to PEM format text, then to a secure key
  // Usually the base64 string provided in env vars is just the base64 encoded version of the standard PEM file.
  let pemText = "";
  try {
     pemText = atob(apnsAuthKeyBase64);
  } catch (e) {
     throw new Error("APNS_AUTH_KEY_BASE64 is not a valid base64 string.");
  }
  
  // Extract the base64 encoded key material from the PEM format
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pemText.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  
  const binaryDer = base64ToUint8Array(pemContents);
  
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );

  const payload = {
    iss: apnsTeamId,
    iat: Math.floor(Date.now() / 1000)
  };

  const token = await jwt.create(
    { alg: "ES256", kid: apnsKeyId },
    payload,
    privateKey
  );

  return token;
}

async function sendPushNotification(deviceToken: string, notificationData: any, authToken: string) {
  const apnsDomain = isProduction ? "api.push.apple.com" : "api.development.push.apple.com";
  const url = `https://${apnsDomain}/3/device/${deviceToken}`;

  const payload = {
    aps: {
      alert: {
        title: notificationData.title,
        body: notificationData.message
      },
      sound: "default",
      badge: 1,
    },
    ...notificationData.data
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "authorization": `bearer ${authToken}`,
      "apns-topic": apnsBundleId,
      "apns-push-type": "alert",
      "apns-expiration": "0", // Send immediately
      "apns-priority": "10" 
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to send push to ${deviceToken}. Status: ${response.status}`, errorText);
    return { success: false, status: response.status, error: errorText };
  }

  return { success: true };
}

serve(async (req) => {
  // Database Webhooks will send a JSON payload representing the record
  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400 });
  }

  // Expecting a payload from a Supabase Database Webhook on the `notifications` table
  const record = payload.record;
  if (!record || !record.user_id) {
    return new Response(JSON.stringify({ error: "Missing record or user_id" }), { status: 400 });
  }

  const title = record.title || "Nueva Notificación";
  const message = record.message || "";
  const extraData = { screen: record.link || "" }; // Pass any extra data your app uses

  // 1. Initialize Supabase client
  // Using the service role key to bypass RLS and read all device tokens
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
     return new Response(JSON.stringify({ error: "Missing Supabase URL or Service Role Key" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // 2. Fetch device tokens for the user
  const { data: tokens, error: tokensError } = await supabase
    .from("device_tokens")
    .select("token")
    .eq("user_id", record.user_id)
    .eq("platform", "ios");

  if (tokensError) {
    console.error("Error fetching tokens:", tokensError);
    return new Response(JSON.stringify({ error: "Error fetching device tokens" }), { status: 500 });
  }

  if (!tokens || tokens.length === 0) {
    console.log(`No iOS device tokens found for user ${record.user_id}`);
    return new Response(JSON.stringify({ message: "No iOS device tokens found for this user." }), { status: 200 });
  }

  // 3. Generate APNs JWT
  let apnsJwt;
  try {
    apnsJwt = await generateAPNsToken();
  } catch (error: any) {
    console.error("Error generating APNs token:", error);
    return new Response(JSON.stringify({ error: "APNs Configuration Error: " + error.message }), { status: 500 });
  }

  // 4. Send to all devices
  const results = [];
  for (const row of tokens) {
    const deviceToken = row.token;
    const result = await sendPushNotification(deviceToken, { title, message, data: extraData }, apnsJwt);
    results.push({ token: deviceToken, ...result });

    // Handles expired tokens (Apple returns 410 Unregistered when a user uninstalls the app)
    if (result.status === 410 || (result.error && result.error.includes("Unregistered"))) {
       console.log(`Token ${deviceToken} is unregistered. Deleting from database.`);
       await supabase.from("device_tokens").delete().eq("token", deviceToken);
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
