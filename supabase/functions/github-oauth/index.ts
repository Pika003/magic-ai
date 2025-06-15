
// deno-lint-ignore-file no-explicit-any
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GITHUB_CLIENT_ID = Deno.env.get("GITHUB_CLIENT_ID");
const GITHUB_CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET");
const APP_URL = Deno.env.get("APP_URL") || "https://wrvobkcgxmemexernxne.supabase.co"; // Replace with your deployed frontend

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path_parts = url.pathname.split("/");
  const action = path_parts[path_parts.length - 1] || path_parts[path_parts.length - 2];

  // 1. Step: Initiate: redirect user to GitHub
  if (action === "start") {
    const redirectUri = `${APP_URL}/functions/v1/github-oauth/callback`;
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo%20user&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return new Response(
      JSON.stringify({ url: githubUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Step: Callback: GitHub redirects here with ?code=...
  if (action === "callback" && req.method === "POST") {
    try {
      const { code } = await req.json();
      if (!code)
        return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: corsHeaders });

      // Exchange code for access token
      const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${APP_URL}/functions/v1/github-oauth/callback`,
        }),
      });
      const tokenData = await tokenResp.json();
      // tokenData.access_token, tokenData.token_type, tokenData.scope

      if (tokenData.error) {
        return new Response(JSON.stringify(tokenData), { status: 400, headers: corsHeaders });
      }

      // You could store this token in Supabase here by user id
      // Demo just returns token for now
      return new Response(JSON.stringify({ access_token: tokenData.access_token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid endpoint", path: url.pathname }), { status: 400, headers: corsHeaders });
});
