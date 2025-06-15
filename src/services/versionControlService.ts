
import { supabase } from "@/integrations/supabase/client";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  html_url: string;
  default_branch: string;
  updated_at: string;
  visibility?: string;
  owner?: {
    login: string;
    avatar_url: string;
  };
}

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string | null;
  visibility: string;
  web_url: string;
  default_branch: string;
  last_activity_at: string;
  namespace?: {
    name: string;
    full_path: string;
  };
}

export const fetchGitHubRepositories = async (): Promise<Repository[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("No session found");
      return [];
    }

    console.log("Fetching GitHub repositories...");
    const response = await supabase.functions.invoke('github-data', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { kind: 'repos' }
    });

    console.log("GitHub API response:", response);

    if (response.error) {
      console.error("GitHub API error:", response.error);
      return [];
    }

    // Ensure we return an array
    const data = response.data;
    if (!Array.isArray(data)) {
      console.warn("GitHub API returned non-array data:", data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
};

export const fetchGitLabProjects = async (): Promise<GitLabProject[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("No session found");
      return [];
    }

    console.log("Fetching GitLab projects...");
    const response = await supabase.functions.invoke('gitlab-data', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { kind: 'projects' }
    });

    console.log("GitLab API response:", response);

    if (response.error) {
      console.error("GitLab API error:", response.error);
      return [];
    }

    // Ensure we return an array
    const data = response.data;
    if (!Array.isArray(data)) {
      console.warn("GitLab API returned non-array data:", data);
      return [];
    }

    return data;
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
