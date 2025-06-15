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

  const [activeTab, setActiveTab] = useState<'github' | 'gitlab'>('github');
  // Track if we've fetched already to avoid multiple API calls
  const [githubFetched, setGithubFetched] = useState(false);
  const [gitlabFetched, setGitlabFetched] = useState(false);

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
      setGithubFetched(true);
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
      setGitlabFetched(true);
    } catch (e) {
      setError("Failed to fetch GitLab projects.");
      setGitlabProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch only for active tab
  useEffect(() => {
    if (activeTab === 'github' && !githubFetched) {
      fetchGitHubData();
    }
    if (activeTab === 'gitlab' && !gitlabFetched) {
      fetchGitLabData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Used by page/tab to fetch only what is needed
  const fetchDataForTab = async (tab: 'github' | 'gitlab') => {
    setActiveTab(tab);
    if (tab === 'github' && !githubFetched) {
      await fetchGitHubData();
    } else if (tab === 'gitlab' && !gitlabFetched) {
      await fetchGitLabData();
    }
  };

  // For manual refresh (refreshes both)
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    await checkConnections();
    setGithubFetched(false);
    setGitlabFetched(false);
    await Promise.all([fetchGitHubData(), fetchGitLabData()]);
    setLoading(false);
    toast({
      title: "Refreshed",
      description: "Repository data has been updated",
    });
  };

  // Change: don't run both fetches on mount, only check connections
  useEffect(() => {
    (async () => {
      await checkConnections();
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
    activeTab, // expose current tab
    setActiveTab, // expose setter
    checkConnections,
  };
};
