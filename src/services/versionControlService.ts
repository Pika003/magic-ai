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

const handleTokenExpiration = async (provider: 'github' | 'gitlab') => {
  console.log(`Token expired for ${provider}, marking as disconnected`);
  
  // Mark token as disconnected in database
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const tableName = provider === 'github' ? 'user_github_tokens' : 'user_gitlab_tokens';
    await supabase
      .from(tableName)
      .update({ connected: false })
      .eq('user_id', session.user.id);
  }
};

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

    // Check for function call errors first
    if (response.error) {
      console.error("GitHub function error:", response.error);
      await handleTokenExpiration('github');
      return [];
    }

    // Check for token expiration in the response data
    if (response.data && typeof response.data === 'string' && response.data.includes('expired')) {
      console.error("GitHub token expired:", response.data);
      await handleTokenExpiration('github');
      return [];
    }

    let repos: GitHubRepository[] = [];
    // If response is a string (JSON array), parse it
    if (typeof response.data === 'string') {
      repos = JSON.parse(response.data);
    } else if (Array.isArray(response.data)) {
      repos = response.data;
    } else {
      console.error("GitHub API error or non-array data:", response);
      // Check if it's a token expiration error in the response data
      if (response.data && typeof response.data === 'object' && 
          (response.data.error_description?.includes('expired') || response.data.error?.includes('expired'))) {
        await handleTokenExpiration('github');
      }
      return [];
    }
    return repos;
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    // Check if it's a token expiration error
    if (error && typeof error === 'object' && 
        (error.message?.includes('expired') || error.toString().includes('expired'))) {
      await handleTokenExpiration('github');
    }
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

    // Check for function call errors first
    if (response.error) {
      console.error("GitLab function error:", response.error);
      await handleTokenExpiration('gitlab');
      return [];
    }

    // Check for token expiration in the response data
    if (response.data && typeof response.data === 'string' && response.data.includes('expired')) {
      console.error("GitLab token expired:", response.data);
      await handleTokenExpiration('gitlab');
      return [];
    }

    let projects: GitLabProject[] = [];
    // If response is a string (JSON array), parse it
    if (typeof response.data === 'string') {
      projects = JSON.parse(response.data);
    } else if (Array.isArray(response.data)) {
      projects = response.data;
    } else {
      console.error("GitLab API error or non-array data:", response);
      // Check if it's a token expiration error in the response data
      if (response.data && typeof response.data === 'object' && 
          (response.data.error_description?.includes('expired') || response.data.error?.includes('expired'))) {
        await handleTokenExpiration('gitlab');
      }
      return [];
    }
    return projects;
  } catch (error) {
    console.error("Error fetching GitLab projects:", error);
    // Check if it's a token expiration error
    if (error && typeof error === 'object' && 
        (error.message?.includes('expired') || error.toString().includes('expired'))) {
      await handleTokenExpiration('gitlab');
    }
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

export const disconnectProvider = async (provider: 'github' | 'gitlab'): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const tableName = provider === 'github' ? 'user_github_tokens' : 'user_gitlab_tokens';
    // Set connected to false and null out the access_token to ensure true disconnect
    await supabase
      .from(tableName)
      .update({ connected: false, access_token: null, refresh_token: null, scope: null, token_type: null, expires_at: null, updated_at: new Date().toISOString() })
      .eq('user_id', session.user.id);
  } catch (error) {
    console.error(`Error disconnecting ${provider}:`, error);
  }
};
