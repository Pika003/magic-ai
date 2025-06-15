
// deno-lint-ignore-file no-explicit-any
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GITLAB_CLIENT_ID = Deno.env.get("GITLAB_CLIENT_ID");
const GITLAB_CLIENT_SECRET = Deno.env.get("GITLAB_CLIENT_SECRET");
const APP_URL = Deno.env.get("APP_URL") || "https://wrvobkcgxmemexernxne.supabase.co"; // Replace if you want to use your own domain

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  if (url.pathname.endsWith("/start")) {
    const redirectUri = `${APP_URL}/functions/v1/gitlab-oauth/callback`;
    const gitlabUrl = `https://gitlab.com/oauth/authorize?client_id=${GITLAB_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read_user+api`;
    return new Response(
      JSON.stringify({ url: gitlabUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (url.pathname.endsWith("/callback") && req.method === "POST") {
    try {
      const { code } = await req.json();
      if (!code)
        return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: corsHeaders });

      const tokenResp = await fetch("https://gitlab.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: GITLAB_CLIENT_ID ?? "",
          client_secret: GITLAB_CLIENT_SECRET ?? "",
          code,
          grant_type: "authorization_code",
          redirect_uri: `${APP_URL}/functions/v1/gitlab-oauth/callback`,
        }).toString(),
      });
      const tokenData = await tokenResp.json();
      if (tokenData.error) {
        return new Response(JSON.stringify(tokenData), { status: 400, headers: corsHeaders });
      }

      // You could store this token in Supabase here by user id
      return new Response(JSON.stringify({ access_token: tokenData.access_token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid endpoint" }), { status: 400, headers: corsHeaders });
});
