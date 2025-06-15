
import { useState, useEffect } from 'react';
import { 
  fetchGitHubRepositories, 
  fetchGitLabProjects, 
  checkConnectionStatus,
  Repository,
  GitLabProject 
} from '@/services/versionControlService';
import { toast } from '@/hooks/use-toast';

export const useVersionControl = () => {
  const [githubRepos, setGithubRepos] = useState<Repository[]>([]);
  const [gitlabProjects, setGitlabProjects] = useState<GitLabProject[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [gitlabConnected, setGitlabConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkConnections = async () => {
    const [githubStatus, gitlabStatus] = await Promise.all([
      checkConnectionStatus('github'),
      checkConnectionStatus('gitlab')
    ]);
    
    setGithubConnected(githubStatus);
    setGitlabConnected(gitlabStatus);
  };

  const fetchData = async () => {
    setLoading(true);
    
    try {
      await checkConnections();
      
      const [repos, projects] = await Promise.all([
        fetchGitHubRepositories(),
        fetchGitLabProjects()
      ]);
      
      setGithubRepos(repos);
      setGitlabProjects(projects);
    } catch (error) {
      console.error('Error fetching version control data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch repository data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchData();
    toast({
      title: "Refreshed",
      description: "Repository data has been updated",
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    githubRepos,
    gitlabProjects,
    githubConnected,
    gitlabConnected,
    loading,
    refreshData,
    checkConnections
  };
};
