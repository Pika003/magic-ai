import { supabase } from "@/integrations/supabase/client";
import axios from "axios";

/**
 * Create a new branch in the given repo/project.
 */
export async function createBranch({ provider, repo, branchName }: { provider: string, repo: any, branchName: string }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const body = provider === "github"
    ? { kind: "create-branch", repoId: repo.id, branchName }
    : { kind: "create-branch", projectId: repo.id, branchName };
  const fn = "common-git-action";
  const response = await supabase.functions.invoke(fn, {
    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
    },
    body,
  });
  if (response.error) throw new Error(response.error.message || response.error);
  return response.data;
}

/**
 * View commits for the given repo/project.
 */
export async function viewCommits({ provider, repo }: { provider: string, repo: any }) {
  const { data } = await supabase
    .from('user_github_tokens')
    .select('access_token')
    .eq('connected', true)
    .maybeSingle();
  
  const accessToken = data?.access_token;
  if (!accessToken) throw new Error("Not authenticated");
  
  const params = {
    platform: provider,
    token: accessToken, 
    owner: repo.owner.login,
    projectId: repo.id, 
    repo: repo.name, 
    branch: repo.default_branch 
  };

  const response = await axios.get('https://battleship-8p92.onrender.com/vcs/view-commits', { params })
    .catch(error => {
      console.error('Error fetching commits:', error.response?.data || error.message);
      throw error;
    });

  return response.data;
}

/**
 * Merge a branch in the given repo/project.
 */
export async function mergeBranch({ provider, repo, sourceBranch, targetBranch }: { provider: string, repo: any, sourceBranch: string, targetBranch: string }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const body = provider === "github"
    ? { kind: "merge-branch", repoId: repo.id, sourceBranch, targetBranch }
    : { kind: "merge-branch", projectId: repo.id, sourceBranch, targetBranch };
  const fn = "common-git-action";
  const response = await supabase.functions.invoke(fn, {
    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
    },
    body,
  });
  if (response.error) throw new Error(response.error.message || response.error);
  return response.data;
}

/**
 * Rollback to a specific commit in the given repo/project.
 */
export async function rollbackToCommit({ provider, repo, commitSha }: { provider: string, repo: any, commitSha: string }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const body = provider === "github"
    ? { kind: "rollback-to-commit", repoId: repo.id, commitSha }
    : { kind: "rollback-to-commit", projectId: repo.id, commitSha };
  const fn = "common-git-action";
  const response = await supabase.functions.invoke(fn, {
    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
    },
    body,
  });
  if (response.error) throw new Error(response.error.message || response.error);
  return response.data;
}

/**
 * Revert a specific commit in the given repo/project.
 */
export async function revertCommit({ provider, repo, commitSha }: { provider: string, repo: any, commitSha: string }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const body = provider === "github"
    ? { kind: "revert-commit", repoId: repo.id, commitSha }
    : { kind: "revert-commit", projectId: repo.id, commitSha };
  const fn = "common-git-action";
  const response = await supabase.functions.invoke(fn, {
    headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
    },
    body,
  });
  if (response.error) throw new Error(response.error.message || response.error);
  return response.data;
} 