
import { useState, useEffect, useCallback } from 'react';
import {
  fetchGitHubRepositories,
  fetchGitLabProjects,
  checkConnectionStatus,
  disconnectProvider,
  GitHubRepository,
  GitLabProject
} from '@/services/versionControlService';
import { toast } from '@/hooks/use-toast';

export const useVersionControl = () => {
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [gitlabProjects, setGitlabProjects] = useState<GitLabProject[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [gitlabConnected, setGitlabConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check connections without fetching data
  const checkConnections = useCallback(async () => {
    try {
      const [githubStatus, gitlabStatus] = await Promise.all([
        checkConnectionStatus('github'),
        checkConnectionStatus('gitlab')
      ]);
      setGithubConnected(githubStatus);
      setGitlabConnected(gitlabStatus);
    } catch (err) {
      console.error('Error checking connections:', err);
      setError('Failed to check platform connections.');
    }
  }, []);

  const fetchGitHubData = useCallback(async () => {
    // First check if we're actually connected
    const isConnected = await checkConnectionStatus('github');
    setGithubConnected(isConnected);
    
    if (!isConnected) {
      setGithubRepos([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchGitHubRepositories();
      setGithubRepos(data);
      
      // If we got empty data, check if connection is still valid
      if (data.length === 0) {
        const newStatus = await checkConnectionStatus('github');
        setGithubConnected(newStatus);
        if (!newStatus) {
          toast({
            title: "GitHub Token Expired",
            description: "Please reconnect your GitHub account to continue accessing repositories.",
            variant: "destructive",
          });
        }
      }
    } catch (e) {
      console.error("GitHub fetch error:", e);
      setError("Failed to fetch GitHub repositories.");
      setGithubRepos([]);
      
      // Check if connection is still valid after error
      const status = await checkConnectionStatus('github');
      setGithubConnected(status);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGitLabData = useCallback(async () => {
    // First check if we're actually connected
    const isConnected = await checkConnectionStatus('gitlab');
    setGitlabConnected(isConnected);
    
    if (!isConnected) {
      setGitlabProjects([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchGitLabProjects();
      setGitlabProjects(data);
      
      // If we got empty data, check if connection is still valid
      if (data.length === 0) {
        const newStatus = await checkConnectionStatus('gitlab');
        setGitlabConnected(newStatus);
        if (!newStatus) {
          toast({
            title: "GitLab Token Expired",
            description: "Please reconnect your GitLab account to continue accessing projects.",
            variant: "destructive",
          });
        }
      }
    } catch (e) {
      console.error("GitLab fetch error:", e);
      setError("Failed to fetch GitLab projects.");
      setGitlabProjects([]);
      
      // Check if connection is still valid after error
      const status = await checkConnectionStatus('gitlab');
      setGitlabConnected(status);
    } finally {
      setLoading(false);
    }
  }, []);

  // Used by page/tab to fetch only what is needed
  const fetchDataForTab = useCallback(async (tab: 'github' | 'gitlab') => {
    if (tab === 'github') {
      await fetchGitHubData();
    } else {
      await fetchGitLabData();
    }
  }, [fetchGitHubData, fetchGitLabData]);

  // Refresh both connections and data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // First check connections and update state
    const [ghStatus, glStatus] = await Promise.all([
        checkConnectionStatus('github'),
        checkConnectionStatus('gitlab')
    ]);
    setGithubConnected(ghStatus);
    setGitlabConnected(glStatus);
    
    // Then fetch data for newly confirmed connected services
    const promises = [];
    if (ghStatus) {
      promises.push(fetchGitHubData());
    }
    if (glStatus) {
      promises.push(fetchGitLabData());
    }
    
    await Promise.all(promises);
    setLoading(false);
    
    toast({
      title: "Refreshed",
      description: "Repository data has been updated",
    });
  }, [fetchGitHubData, fetchGitLabData]);

  // Disconnect a provider
  const handleDisconnect = useCallback(async (provider: 'github' | 'gitlab') => {
    try {
      await disconnectProvider(provider);

      // After disconnect, clear state and force refresh connection status
      if (provider === 'github') {
        setGithubConnected(false);
        setGithubRepos([]);
      } else {
        setGitlabConnected(false);
        setGitlabProjects([]);
      }
      setError(null);
      // After this, force a check for new connection status so reconnection works
      await checkConnections();

      toast({
        title: `${provider === 'github' ? 'GitHub' : 'GitLab'} Disconnected`,
        description: "You can reconnect anytime to access your repositories.",
      });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: `Failed to disconnect ${provider === 'github' ? 'GitHub' : 'GitLab'}. Please try again.`,
        variant: "destructive",
      });
    }
  }, [checkConnections]);

  // Initialize: only check connections, don't fetch data automatically
  useEffect(() => {
    (async () => {
      setLoading(true);
      await checkConnections();
      setLoading(false);
    })();
  }, [checkConnections]);

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
    handleDisconnect,
  };
};
