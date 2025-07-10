import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


serve(async (req) => {
  try {
    const { kind, repoId, projectId, branchName, sourceBranch, targetBranch, commitSha } = await req.json();
    // You should extract the user's token from headers or session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: corsHeaders });
    }
    // Extract Bearer token
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = tokenMatch ? tokenMatch[1] : null;
    if (!token) {
      return new Response(JSON.stringify({ error: "Invalid Authorization header" }), { status: 401 });
    }

    // Helper: choose provider and id
    const isGitHub = !!repoId;
    const id = repoId || projectId;

    // TODO: Fetch user's OAuth token from your DB using Supabase client if needed

    // --- GitHub API helpers ---
    const githubApi = async (endpoint: string, method = "GET", body?: any) => {
      const url = `https://api.github.com${endpoint}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return res.json();
    };

    // --- GitLab API helpers ---
    const gitlabApi = async (endpoint: string, method = "GET", body?: any) => {
      const url = `https://gitlab.com/api/v4${endpoint}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return res.json();
    };

    // --- Action Routing ---
    switch (kind) {
      case "create-branch":
        if (isGitHub) {
          // Get default branch SHA
          const repo = await githubApi(`/repos/${id}`);
          const sha = repo.default_branch
            ? (await githubApi(`/repos/${id}/git/ref/heads/${repo.default_branch}`)).object.sha
            : undefined;
          if (!sha) throw new Error("Could not get default branch SHA");
          const result = await githubApi(`/repos/${id}/git/refs`, "POST", {
            ref: `refs/heads/${branchName}`,
            sha,
          });
          return new Response(JSON.stringify(result));
        } else {
          // GitLab: create branch
          const result = await gitlabApi(`/projects/${id}/repository/branches?branch=${encodeURIComponent(branchName)}&ref=main`, "POST");
          return new Response(JSON.stringify(result));
        }

      case "merge-branch":
        if (isGitHub) {
          const result = await githubApi(`/repos/${id}/merges`, "POST", {
            base: targetBranch,
            head: sourceBranch,
          });
          return new Response(JSON.stringify(result));
        } else {
          const result = await gitlabApi(`/projects/${id}/merge_requests`, "POST", {
            source_branch: sourceBranch,
            target_branch: targetBranch,
            title: `Merge ${sourceBranch} into ${targetBranch}`,
          });
          return new Response(JSON.stringify(result));
        }

      case "rollback-to-commit":
        // Not natively supported by GitHub/GitLab API; you may need to implement via workflow or CI
        return new Response(JSON.stringify({ error: "Rollback not implemented in API" }), { status: 400 });

      case "revert-commit":
        if (isGitHub) {
          // GitHub: create a revert commit via the API (requires a PR or manual commit)
          return new Response(JSON.stringify({ error: "Revert not implemented in API" }), { status: 400 });
        } else {
          // GitLab: revert commit
          const result = await gitlabApi(`/projects/${id}/repository/commits/${commitSha}/revert`, "POST");
          return new Response(JSON.stringify(result));
        }

      case "view-commits":
        if (isGitHub) {
          const result = await githubApi(`/repos/${id}/commits`);
          return new Response(JSON.stringify(result));
        } else {
          const result = await gitlabApi(`/projects/${id}/repository/commits`);
          return new Response(JSON.stringify(result));
        }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), { status: 500 });
  }
});