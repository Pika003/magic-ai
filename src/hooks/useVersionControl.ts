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

  // Only fetch for the activeTab, and never fetch both at once
  const [activeTab, setActiveTab] = useState<'github' | 'gitlab'>('github');
  const [githubFetched, setGithubFetched] = useState(false);
  const [gitlabFetched, setGitlabFetched] = useState(false);

  // Check connections on mount, but don't fetch data yet
  useEffect(() => {
    (async () => {
      setLoading(true);
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
      setLoading(false);
    })();
  }, []);

  // Fetch data only for the activeTab, and only if not yet fetched
  useEffect(() => {
    const fetchForTab = async () => {
      setLoading(true);
      setError(null);

      if (activeTab === 'github' && !githubFetched) {
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
        }
      } else if (activeTab === 'gitlab' && !gitlabFetched) {
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
        }
      }
      setLoading(false);
    };

    fetchForTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Manual refresh resets both tabs so users can get new data if they switch
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [githubStatus, gitlabStatus] = await Promise.all([
        checkConnectionStatus('github'),
        checkConnectionStatus('gitlab')
      ]);
      setGithubConnected(githubStatus);
      setGitlabConnected(gitlabStatus);
      setGithubFetched(false);
      setGitlabFetched(false);
      // Only reload current tab data—others will load on demand
      if (activeTab === 'github') {
        if (githubStatus) {
          const data = await fetchGitHubRepositories();
          setGithubRepos(data);
        } else {
          setGithubRepos([]);
        }
        setGithubFetched(true);
      } else if (activeTab === 'gitlab') {
        if (gitlabStatus) {
          const data = await fetchGitLabProjects();
          setGitlabProjects(data);
        } else {
          setGitlabProjects([]);
        }
        setGitlabFetched(true);
      }
      toast({
        title: "Refreshed",
        description: "Repository data has been updated",
      });
    } catch {
      setError("Unable to refresh repository data.");
    }
    setLoading(false);
  };

  // Used by page/tab to manually switch
  const fetchDataForTab = async (tab: 'github' | 'gitlab') => {
    setActiveTab(tab);
    // No immediate fetch here; effect will trigger correctly on tab switch
  };

  return {
    githubRepos,
    gitlabProjects,
    githubConnected,
    gitlabConnected,
    loading,
    error,
    refreshData,
    fetchDataForTab,
    activeTab,
    setActiveTab,
    checkConnections: async () => {
      try {
        const [githubStatus, gitlabStatus] = await Promise.all([
          checkConnectionStatus('github'),
          checkConnectionStatus('gitlab')
        ]);
        setGithubConnected(githubStatus);
        setGitlabConnected(gitlabStatus);
      } catch (e) {
        setError('Failed to check platform connection.');
      }
    }
  };
};
