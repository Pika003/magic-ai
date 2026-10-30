import { api } from "@/lib/apiClient";

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
    const data = await api.get<GitHubRepository[]>('/github/repos');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
};

export const fetchGitLabProjects = async (): Promise<GitLabProject[]> => {
  try {
    const data = await api.get<GitLabProject[]>('/gitlab/projects');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching GitLab projects:", error);
    return [];
  }
};

export const checkConnectionStatus = async (provider: 'github' | 'gitlab'): Promise<boolean> => {
  try {
    const data = await api.get<{ connected: boolean }>(`/${provider}/status`);
    return !!data.connected;
  } catch (error) {
    console.error(`Error checking ${provider} connection:`, error);
    return false;
  }
};

export const disconnectProvider = async (provider: 'github' | 'gitlab'): Promise<void> => {
  try {
    await api.post(`/${provider}/disconnect`);
  } catch (error) {
    console.error(`Error disconnecting ${provider}:`, error);
    throw error;
  }
};
