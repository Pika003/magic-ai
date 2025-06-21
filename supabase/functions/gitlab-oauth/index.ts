import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GITLAB_CLIENT_ID = Deno.env.get("GITLAB_CLIENT_ID");
const GITLAB_CLIENT_SECRET = Deno.env.get("GITLAB_CLIENT_SECRET");
const APP_URL = Deno.env.get("APP_URL") || "https://wrvobkcgxmemexernxne.supabase.co";
const FRONTEND_URL = "https://magicaidevops.netlify.app";

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

    // Include the supabaseToken in the state parameter for GitLab OAuth
    const state = encodeURIComponent(supabaseToken);
    const redirectUri = `${APP_URL}/functions/v1/gitlab-oauth/callback`;
    const gitlabUrl = `https://gitlab.com/oauth/authorize?client_id=${GITLAB_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read_user+api&state=${state}`;
    
    return new Response(JSON.stringify({ url: gitlabUrl }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  if (action === "callback") {
    try {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      
      if (!code) {
        const redirect = new URL(`/version-control?provider=gitlab&status=error&message=Missing_authorization_code`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      if (!state) {
        const redirect = new URL(`/version-control?provider=gitlab&status=error&message=Missing_Supabase_token`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      const supaToken = decodeURIComponent(state);

      // Parse and validate the JWT token
      let userId;
      try {
        const parsedToken = parseJwt(supaToken);
        userId = parsedToken.sub;
        if (!userId) {
          throw new Error("No user ID in token");
        }
      } catch (e) {
        console.error("Failed to parse JWT token:", e);
        const redirect = new URL(`/version-control?provider=gitlab&status=error&message=Invalid_token`, FRONTEND_URL);
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

      // Validate that we got an access token
      if (!tokenData.access_token) {
        console.error("No access token received from GitLab:", tokenData);
        const redirect = new URL(`/version-control?provider=gitlab&status=error&message=No_access_token_received`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      console.log("Attempting to save GitLab token for user:", userId);

      // First, delete any existing token record to start fresh
      await fetch(`${APP_URL}/rest/v1/user_gitlab_tokens?user_id=eq.${userId}`, {
        method: "DELETE",
        headers: {
          "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
          "Authorization": `Bearer ${supaToken}`,
        },
      });

      // Prepare the data object for the new token record
      const postData: any = {
        user_id: userId,
        access_token: tokenData.access_token,
        scope: tokenData.scope ?? "read_user api",
        token_type: tokenData.token_type ?? "bearer",
        connected: true,
        updated_at: new Date().toISOString(),
      };
      
      if (tokenData.refresh_token) {
        postData.refresh_token = tokenData.refresh_token;
      }
      
      if (tokenData.expires_in && !isNaN(Number(tokenData.expires_in))) {
        const expiresAt = new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString();
        postData.expires_at = expiresAt;
      }

      // Insert the new token record
      const saveResponse = await fetch(`${APP_URL}/rest/v1/user_gitlab_tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
          "Authorization": `Bearer ${supaToken}`,
        },
        body: JSON.stringify(postData),
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error("Failed to save GitLab token:", errorText);
        console.error("Response status:", saveResponse.status);
        console.error("Post data:", JSON.stringify(postData, null, 2));
        const redirect = new URL(`/version-control?provider=gitlab&status=error&message=Failed_to_save_token`, FRONTEND_URL);
        return Response.redirect(redirect.href, 302);
      }

      console.log("Successfully saved GitLab token for user:", userId);
      const redirect = new URL('/version-control?provider=gitlab&status=success', FRONTEND_URL);
      return Response.redirect(redirect.href, 302);

    } catch (e) {
      console.error("GitLab OAuth callback error:", e);
      const redirect = new URL(`/version-control?provider=gitlab&status=error&message=${encodeURIComponent(e.message)}`, FRONTEND_URL);
      return Response.redirect(redirect.href, 302);
    }
  }

  return new Response(JSON.stringify({ error: "Invalid endpoint", path: url.pathname }), { 
    status: 400, 
    headers: corsHeaders 
  });
});
