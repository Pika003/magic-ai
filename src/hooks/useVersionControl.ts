
import { useState, useEffect } from 'react';
import {
  fetchGitHubRepositories,
  fetchGitLabProjects,
  checkConnectionStatus,
  disconnectProvider,
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
        
        // If we got empty data, it might be due to expired token
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
      } else {
        setGithubRepos([]);
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
        
        // If we got empty data, it might be due to expired token
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
      } else {
        setGitlabProjects([]);
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

  // Disconnect a provider
  const handleDisconnect = async (provider: 'github' | 'gitlab') => {
    try {
      await disconnectProvider(provider);
      if (provider === 'github') {
        setGithubConnected(false);
        setGithubRepos([]);
      } else {
        setGitlabConnected(false);
        setGitlabProjects([]);
      }
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
    handleDisconnect,
  };
};
