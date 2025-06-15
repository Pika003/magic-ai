
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
      // Buffer is not available in Deno, use Uint8Array as Stripe wants raw bytes
      event = stripe.webhooks.constructEvent(
        typeof bodyBuf === "string" ? bodyBuf : Buffer.from(bodyBuf), // fallback
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error("❌ Stripe webhook signature error", err.message);
      return jsonResponse({ error: "Invalid signature" }, 400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const userId = session.metadata?.user_id || null;
      const email = session.customer_email || null;
      const sessionId = session.id || null;
      const paymentIntentId = session.payment_intent || null;

      if (!userId && !email) {
        return jsonResponse({ error: "No user_id or email in session" }, 400);
      }

      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

      // 1. Update the user's paid_user status
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
          .eq("email", email);
      }
      if (updateResult?.error) {
        console.error("Failed to update paid_user", updateResult.error);
        return jsonResponse({ error: "Supabase update failed" }, 500);
      }

      // 2. Mark any matching payment_records as 'paid'
      if (sessionId) {
        const { data: recs, error: findErr } = await supabase
          .from("payment_records")
          .select("id,status")
          .eq("payment_id", sessionId)
          .maybeSingle();

        if (findErr) {
          console.warn("Warning: Could not find payment_record by payment_id", findErr);
        } else if (recs && recs.status !== "paid") {
          const { error: updatePayErr } = await supabase
            .from("payment_records")
            .update({ status: "paid", updated_at: new Date().toISOString() })
            .eq("payment_id", sessionId);
          if (updatePayErr) {
            console.error("Error updating payment_record status", updatePayErr);
          } else {
            console.log("✅ payment_records status marked as paid:", sessionId);
          }
        }
      }

      console.log("✅ paid_user upgraded for", userId || email, "and payment_records updated if found");
      return jsonResponse({ status: "success" });
    }

    // Ignore other event types
    return jsonResponse({ status: "ignored event", event: event.type }, 200);

  } catch (e: any) {
    console.error("Stripe webhook error", e);
    return jsonResponse({ error: "Internal error", details: e?.message || e?.toString() }, 500);
  }
});
