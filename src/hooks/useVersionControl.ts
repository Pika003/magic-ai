
import { useState, useEffect } from 'react';
import {
  fetchGitHubRepositories,
  fetchGitLabProjects,
  checkConnectionStatus,
  GitHubRepository,
  GitLabProject
} from '@/services/versionControlService';
import { toast } from '@/hooks/use-toast';

// Narrow and independent state management per platform
export const useVersionControl = () => {
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [gitlabProjects, setGitlabProjects] = useState<GitLabProject[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [gitlabConnected, setGitlabConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Re-check connections, but fetch only on demand
  const checkConnections = async () => {
    try {
      const [githubStatus, gitlabStatus] = await Promise.all([
        checkConnectionStatus('github'),
        checkConnectionStatus('gitlab')
      ]);
      setGithubConnected(githubStatus);
      setGitlabConnected(gitlabStatus);
    } catch (err) {
      setError('Failed to check platform connection.');
    }
  };

  const fetchGitHubData = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await checkConnectionStatus('github');
      setGithubConnected(status);
      if (status) {
        const data = await fetchGitHubRepositories();
        setGithubRepos(data);
      } else {
        setGithubRepos([]);
      }
    } catch (e) {
      setError("Failed to fetch GitHub repositories.");
      setGithubRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGitLabData = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await checkConnectionStatus('gitlab');
      setGitlabConnected(status);
      if (status) {
        const data = await fetchGitLabProjects();
        setGitlabProjects(data);
      } else {
        setGitlabProjects([]);
      }
    } catch (e) {
      setError("Failed to fetch GitLab projects.");
      setGitlabProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Used by page/tab to fetch only what is needed
  const fetchDataForTab = async (tab: 'github' | 'gitlab') => {
    if (tab === 'github') {
      await fetchGitHubData();
    } else {
      await fetchGitLabData();
    }
  };

  // Expose single refresh that reloads both (used by Refresh)
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    await checkConnections();
    await Promise.all([fetchGitHubData(), fetchGitLabData()]);
    setLoading(false);
    toast({
      title: "Refreshed",
      description: "Repository data has been updated",
    });
  };

  // By default: initialize both
  useEffect(() => {
    (async () => {
      await checkConnections();
      await Promise.all([fetchGitHubData(), fetchGitLabData()]);
      setLoading(false);
    })();
  }, []);

  return {
    githubRepos,
    gitlabProjects,
    githubConnected,
    gitlabConnected,
    loading,
    error,
    refreshData,
    fetchDataForTab,
    checkConnections,
  };
};
