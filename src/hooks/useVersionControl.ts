
import { useState, useEffect, useCallback } from 'react';
import {
  fetchGitHubRepositories,
  fetchGitLabProjects,
  checkConnectionStatus,
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
  const [activeTab, setActiveTab] = useState<'github' | 'gitlab'>('github');
  
  // Track what has been fetched to prevent duplicate calls
  const [githubDataFetched, setGithubDataFetched] = useState(false);
  const [gitlabDataFetched, setGitlabDataFetched] = useState(false);
  const [connectionsChecked, setConnectionsChecked] = useState(false);

  // Check connections only once on mount
  const checkConnections = useCallback(async () => {
    if (connectionsChecked) return;
    
    setLoading(true);
    try {
      const [githubStatus, gitlabStatus] = await Promise.all([
        checkConnectionStatus('github'),
        checkConnectionStatus('gitlab')
      ]);
      setGithubConnected(githubStatus);
      setGitlabConnected(gitlabStatus);
      setConnectionsChecked(true);
    } catch (err) {
      setError('Failed to check platform connections.');
    } finally {
      setLoading(false);
    }
  }, [connectionsChecked]);

  // Fetch data for specific tab only when needed
  const fetchDataForActiveTab = useCallback(async () => {
    if (!connectionsChecked) return;
    
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'github' && !githubDataFetched && githubConnected) {
        const data = await fetchGitHubRepositories();
        setGithubRepos(data);
        setGithubDataFetched(true);
      } else if (activeTab === 'gitlab' && !gitlabDataFetched && gitlabConnected) {
        const data = await fetchGitLabProjects();
        setGitlabProjects(data);
        setGitlabDataFetched(true);
      }
    } catch (e) {
      const errorMsg = activeTab === 'github' 
        ? "Failed to fetch GitHub repositories." 
        : "Failed to fetch GitLab projects.";
      setError(errorMsg);
      
      if (activeTab === 'github') {
        setGithubRepos([]);
      } else {
        setGitlabProjects([]);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, connectionsChecked, githubConnected, gitlabConnected, githubDataFetched, gitlabDataFetched]);

  // Initial connection check
  useEffect(() => {
    checkConnections();
  }, [checkConnections]);

  // Fetch data when tab changes or connections are established
  useEffect(() => {
    if (connectionsChecked) {
      fetchDataForActiveTab();
    }
  }, [connectionsChecked, fetchDataForActiveTab]);

  // Manual refresh function
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Re-check connections
      const [githubStatus, gitlabStatus] = await Promise.all([
        checkConnectionStatus('github'),
        checkConnectionStatus('gitlab')
      ]);
      setGithubConnected(githubStatus);
      setGitlabConnected(gitlabStatus);

      // Reset fetch flags to allow re-fetching
      setGithubDataFetched(false);
      setGitlabDataFetched(false);

      // Fetch data for current active tab only
      if (activeTab === 'github' && githubStatus) {
        const data = await fetchGitHubRepositories();
        setGithubRepos(data);
        setGithubDataFetched(true);
      } else if (activeTab === 'gitlab' && gitlabStatus) {
        const data = await fetchGitLabProjects();
        setGitlabProjects(data);
        setGitlabDataFetched(true);
      }

      toast({
        title: "Refreshed",
        description: "Repository data has been updated",
      });
    } catch (err) {
      setError("Unable to refresh repository data.");
    } finally {
      setLoading(false);
    }
  };

  // Switch tab function
  const switchTab = (tab: 'github' | 'gitlab') => {
    setActiveTab(tab);
    // Data will be fetched automatically by useEffect when tab changes
  };

  return {
    githubRepos,
    gitlabProjects,
    githubConnected,
    gitlabConnected,
    loading,
    error,
    activeTab,
    refreshData,
    switchTab,
    checkConnections: async () => {
      setConnectionsChecked(false);
      await checkConnections();
    }
  };
};
