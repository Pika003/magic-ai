import { supabase } from "@/integrations/supabase/client";

// Strict types for the real GitHub API objects you showed
export interface GitHubRepositoryOwner {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language?: string | null;
  default_branch?: string | null;
  updated_at?: string;
  archived: boolean;
  owner: GitHubRepositoryOwner;
  [key: string]: any;
}

export interface GitLabNamespace {
  id: number;
  name: string;
  path: string;
  kind: string;
  full_path: string;
  avatar_url?: string | null;
  web_url?: string;
}

export interface GitLabProject {
  id: number;
  description: string | null;
  name: string;
  name_with_namespace?: string;
  path_with_namespace?: string;
  default_branch?: string | null;
  archived: boolean;
  web_url: string;
  http_url_to_repo: string;
  ssh_url_to_repo: string;
  last_activity_at?: string;
  updated_at?: string;
  visibility?: string;
  namespace?: GitLabNamespace;
  [key: string]: any;
}

export const fetchGitHubRepositories = async (): Promise<GitHubRepository[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const response = await supabase.functions.invoke('github-data', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { kind: 'repos' }
    });

    let repos: GitHubRepository[] = [];
    // If response is a string (JSON array), parse it
    if (typeof response === 'string') {
      repos = JSON.parse(response);
    } else if (typeof (response as any)?.data === 'string') {
      repos = JSON.parse((response as any).data);
    } else if (Array.isArray(response)) {
      repos = response as GitHubRepository[];
    } else if (Array.isArray((response as any)?.data)) {
      repos = (response as any).data;
    } else if (Array.isArray((response as any)?.data?.data)) {
      repos = (response as any).data.data;
    } else {
      console.error("GitHub API error or non-array data:", response);
      return [];
    }
    return repos;
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
};

export const fetchGitLabProjects = async (): Promise<GitLabProject[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const response = await supabase.functions.invoke('gitlab-data', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { kind: 'projects' }
    });

    let projects: GitLabProject[] = [];
    // If response is a string (JSON array), parse it
    if (typeof response === 'string') {
      projects = JSON.parse(response);
    } else if (typeof (response as any)?.data === 'string') {
      projects = JSON.parse((response as any).data);
    } else if (Array.isArray(response)) {
      projects = response as GitLabProject[];
    } else if (Array.isArray((response as any)?.data)) {
      projects = (response as any).data;
    } else if (Array.isArray((response as any)?.data?.data)) {
      projects = (response as any).data.data;
    } else {
      console.error("GitLab API error or non-array data:", response);
      return [];
    }
    return projects;
  } catch (error) {
    console.error("Error fetching GitLab projects:", error);
    return [];
  }
};

export const checkConnectionStatus = async (provider: 'github' | 'gitlab'): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const tableName = provider === 'github' ? 'user_github_tokens' : 'user_gitlab_tokens';
    const { data, error } = await supabase
      .from(tableName)
      .select('connected')
      .eq('connected', true)
      .single();
    return !error && data?.connected === true;
  } catch (error) {
    console.error(`Error checking ${provider} connection:`, error);
    return false;
  }
};

/** Get simplified linear commit list for graph:
 * Returns [{ sha, message, author, date, parents: [sha], branch }]
 */
export const fetchCommitHistory = async ({
  provider,
  owner,
  repo,
  projectId,
  branch,
  per_page = 50
}: {
  provider: 'github' | 'gitlab';
  owner?: string;
  repo?: string;
  projectId?: number;
  branch: string;
  per_page?: number;
}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Missing session");
  let response;

  if (provider === 'github' && owner && repo) {
    response = await supabase.functions.invoke('github-data', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { kind: 'commits', owner, repo, branch, per_page }
    });
    let arr: any[] = [];
    if (typeof response === "string") arr = JSON.parse(response);
    else if (typeof (response as any)?.data === "string") arr = JSON.parse((response as any).data);
    else if (Array.isArray(response)) arr = response;
    else if (Array.isArray((response as any)?.data)) arr = (response as any).data;

    return arr.map(c => ({
      sha: c.sha,
      message: c.commit?.message || '',
      author: c.commit?.author?.name || '',
      date: c.commit?.author?.date || '',
      parents: (c.parents || []).map((p: any) => p.sha),
    }));
  }

  if (provider === 'gitlab' && projectId) {
    response = await supabase.functions.invoke('gitlab-data', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { kind: 'commits', project_id: projectId, branch, per_page }
    });
    let arr: any[] = [];
    if (typeof response === "string") arr = JSON.parse(response);
    else if (typeof (response as any)?.data === "string") arr = JSON.parse((response as any).data);
    else if (Array.isArray(response)) arr = response;
    else if (Array.isArray((response as any)?.data)) arr = (response as any).data;

    return arr.map(c => ({
      sha: c.id,
      message: c.title || c.message || '',
      author: c.author_name || (c.author && c.author.name) || '',
      date: c.committed_date || c.created_at || '',
      parents: c.parent_ids || [],
    }));
  }
  return [];
};
