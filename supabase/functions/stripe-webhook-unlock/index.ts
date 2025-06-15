
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Content-Type": "application/json"
};

function jsonResponse(body: any, status: number = 200) {
  return new Response(JSON.stringify(body), { headers: corsHeaders, status });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Missing env secrets/config" }, 500);
    }

    // Read raw request body for webhook verification
    const bodyBuf = await req.arrayBuffer();
    const sig = req.headers.get("stripe-signature") || "";
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        Buffer.from(bodyBuf),
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error("❌ Stripe webhook signature error", err.message);
      return jsonResponse({ error: "Invalid signature" }, 400);
    }

    // Handle session completion for one-time payment/unlock
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // Stripe metadata: user_id = Supabase user.id captured at checkout creation
      const userId = session.metadata?.user_id || null;
      const email = session.customer_email || null;

      if (!userId && !email) {
        return jsonResponse({ error: "No user_id or email in session" }, 400);
      }

      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

      // Find profile by user_id (preferred) or by email:
      let updateResult;
      if (userId) {
        updateResult = await supabase
          .from("profiles")
          .update({ paid_user: true })
          .eq("id", userId);
      } else if (email) {
        updateResult = await supabase
          .from("profiles")
          .update({ paid_user: true })
          .eq("email", email); // if email field is present! (You may need to ensure profile has "email" column.)
      }

      if (updateResult.error) {
        console.error("Failed to update paid_user", updateResult.error);
        return jsonResponse({ error: "Supabase update failed" }, 500);
      }

      console.log("✅ paid_user upgraded for", userId || email);
      return jsonResponse({ status: "success" });
    }

    // Ignore other event types
    return jsonResponse({ status: "ignored event", event: event.type }, 200);

  } catch (e) {
    console.error("Stripe webhook error", e);
    return jsonResponse({ error: "Internal error", details: e?.message || e?.toString() }, 500);
  }
});
