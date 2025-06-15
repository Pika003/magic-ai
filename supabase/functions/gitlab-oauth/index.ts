
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
const APP_URL = Deno.env.get("APP_URL") || "https://wrvobkcgxmemexernxne.supabase.co";
const FRONTEND_URL = "https://preview--sentence-scribe-ai-magic.lovable.app";


serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path_parts = url.pathname.split("/");
  const action = path_parts[path_parts.length - 1] || path_parts[path_parts.length - 2];

  if (action === "start") {
    const redirectUri = `${APP_URL}/functions/v1/gitlab-oauth/callback`;
    const gitlabUrl = `https://gitlab.com/oauth/authorize?client_id=${GITLAB_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read_user+api`;
    return new Response(
      JSON.stringify({ url: gitlabUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (action === "callback") {
    try {
      const code = url.searchParams.get('code');
      if (!code) {
        const redirect = new URL('/version-control?provider=gitlab&status=error&message=Missing_authorization_code', FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

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
        const message = encodeURIComponent(tokenData.error_description || tokenData.error);
        const redirect = new URL(`/version-control?provider=gitlab&status=error&message=${message}`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      const redirect = new URL('/version-control?provider=gitlab&status=success', FRONTEND_URL);
      return Response.redirect(redirect.href, 302);

    } catch (e) {
      const redirect = new URL(`/version-control?provider=gitlab&status=error&message=${encodeURIComponent(e.message)}`, FRONTEND_URL);
      return Response.redirect(redirect.href, 302);
    }
  }

  return new Response(JSON.stringify({ error: "Invalid endpoint", path: url.pathname }), { status: 400, headers: corsHeaders });
});
