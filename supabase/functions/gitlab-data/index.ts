
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchGitlabToken(token: string, appUrl: string) {
  const resp = await fetch(`${appUrl}/rest/v1/user_gitlab_tokens?select=access_token&connected=eq.true`, {
    method: "GET",
    headers: {
      "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
      "Authorization": `Bearer ${token}`,
    },
  });
  const [row] = await resp.json();
  return row?.access_token;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const appUrl = Deno.env.get("APP_URL") || "https://wrvobkcgxmemexernxne.supabase.co";
  const supaToken = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!supaToken) return new Response("Missing auth", { status: 401, headers: corsHeaders });

  const glToken = await fetchGitlabToken(supaToken, appUrl);
  if (!glToken) return new Response("No connected GitLab account", { status: 403, headers: corsHeaders });

  const url = new URL(req.url);
  const kind = url.searchParams.get('kind') || "projects";

  if (kind === "projects") {
    const out = await fetch("https://gitlab.com/api/v4/projects?membership=true", {
      headers: { "Authorization": `Bearer ${glToken}` },
    });
    const data = await out.json();
    return new Response(JSON.stringify(data), { headers: corsHeaders });
  }
  // Add other endpoints (branches, commits...) as needed.
  return new Response("Not implemented", { status: 400, headers: corsHeaders });
});
