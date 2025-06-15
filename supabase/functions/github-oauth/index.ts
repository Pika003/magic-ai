import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GITHUB_CLIENT_ID = Deno.env.get("GITHUB_CLIENT_ID");
const GITHUB_CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET");
const APP_URL = Deno.env.get("APP_URL") || "https://wrvobkcgxmemexernxne.supabase.co";
const FRONTEND_URL = "https://preview--sentence-scribe-ai-magic.lovable.app";

// Helper to parse JWT and extract fields
function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path_parts = url.pathname.split("/");
  const action = path_parts[path_parts.length - 1] || path_parts[path_parts.length - 2];

  // 1. Step: user triggers /start from client
  if (action === "start") {
    // Get the Supabase token from the request body
    let supabaseToken = null;
    try {
      const body = await req.json();
      supabaseToken = body.supabaseToken;
    } catch (e) {
      // If no body, try to get from Authorization header
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        supabaseToken = authHeader.replace("Bearer ", "");
      }
    }

    if (!supabaseToken) {
      return new Response(JSON.stringify({ error: "No Supabase token provided" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Include the supabaseToken in the state parameter for GitHub OAuth
    const state = encodeURIComponent(supabaseToken);
    const redirectUri = `${APP_URL}/functions/v1/github-oauth/callback`;
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo%20user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    return new Response(JSON.stringify({ url: githubUrl }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  // 2. Step: OAuth callback
  if (action === "callback") {
    try {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      
      if (!code) {
        const redirect = new URL(`/version-control?provider=github&status=error&message=Missing_authorization_code`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      if (!state) {
        const redirect = new URL(`/version-control?provider=github&status=error&message=Missing_Supabase_token`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      const supaToken = decodeURIComponent(state);

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

      if (tokenData.error) {
        const redirect = new URL(`/version-control?provider=github&status=error&message=${encodeURIComponent(tokenData.error_description || tokenData.error)}`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      // Prepare the data object, including refresh_token if present
      const postData: any = {
        user_id: parseJwt(supaToken).sub,
        access_token: tokenData.access_token,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        connected: true,
        updated_at: new Date().toISOString(),
      };
      if (tokenData.refresh_token) {
        postData.refresh_token = tokenData.refresh_token;
      }
      if (tokenData.expires_in && !isNaN(Number(tokenData.expires_in))) {
        // GitHub typically doesn't send expires_in, but just in case
        const expiresAt = new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString();
        postData.expires_at = expiresAt;
      }

      // Use UPSERT to handle both new connections and reconnections
      const saveResponse = await fetch(`${APP_URL}/rest/v1/user_github_tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
          "Authorization": `Bearer ${supaToken}`,
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify(postData),
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error("Failed to save GitHub token:", errorText);
        const redirect = new URL(`/version-control?provider=github&status=error&message=Failed_to_save_token`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      const redirect = new URL('/version-control?provider=github&status=success', FRONTEND_URL);
      return Response.redirect(redirect.href, 302);

    } catch (e) {
      console.error("GitHub OAuth callback error:", e);
      const redirect = new URL(`/version-control?provider=github&status=error&message=${encodeURIComponent(e.message)}`, FRONTEND_URL);
      return Response.redirect(redirect.href, 302);
    }
  }
  
  return new Response(JSON.stringify({ error: "Invalid endpoint", path: url.pathname }), { 
    status: 400, 
    headers: corsHeaders 
  });
});
