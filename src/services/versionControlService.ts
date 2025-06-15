
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
    // Edge Function returns plain array as response (not { data } wrapped)
    let repos: GitHubRepository[] = [];
    if (Array.isArray(response)) {
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
    // Edge Function returns plain array as response (not { data } wrapped)
    let projects: GitLabProject[] = [];
    if (Array.isArray(response)) {
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
