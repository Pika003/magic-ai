import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Gitlab, Copy } from 'lucide-react';
import { GitHubRepository, GitLabProject } from '@/services/versionControlService';
import { toast } from '@/hooks/use-toast';
import { GitHubRepoCard } from './GitHubRepoCard';
import { GitLabProjectCard } from './GitLabProjectCard';

interface RepositoryListProps {
  githubRepos?: GitHubRepository[];
  gitlabProjects?: GitLabProject[];
  githubConnected: boolean;
  gitlabConnected: boolean;
  activeTab: 'github' | 'gitlab';
  error?: string | null;
}

export const RepositoryList: React.FC<RepositoryListProps> = ({
  githubRepos = [],
  gitlabProjects = [],
  githubConnected,
  gitlabConnected,
  activeTab,
  error,
}) => {
  const [search, setSearch] = useState("");
  const [branchState, setBranchState] = useState<{ [id: string]: string }>({});

  if (error) return <div className="text-red-500">{error}</div>;

  // Helper: copy to clipboard with toast
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Clone URL copied to clipboard.",
    });
  };

  // Filtered GitHub repos
  const filteredGithubRepos = useMemo(() => {
    if (!search.trim()) return githubRepos;
    return githubRepos.filter(repo =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [search, githubRepos]);

  // Filtered GitLab projects
  const filteredGitlabProjects = useMemo(() => {
    if (!search.trim()) return gitlabProjects;
    return gitlabProjects.filter(project =>
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (project.path_with_namespace || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [search, gitlabProjects]);

  if (activeTab === 'github') {
    if (!githubConnected) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Github className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Connect your GitHub account to view repositories</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <div>
        <div className="mb-4 flex">
          <input
            className="border rounded px-2 py-1 w-full text-sm"
            placeholder="Search repositories by name or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {filteredGithubRepos.length === 0 ? (
          <div>
            <p className="text-muted-foreground">No repositories found{githubRepos.length ? " (filtered)" : ""}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGithubRepos.map((repo) => {
              const currBranch = branchState[repo.id] || repo.default_branch || 'main';
              return (
                <React.Suspense fallback={<div>Loading...</div>} key={repo.id}>
                  <GitHubRepoCard
                    repo={repo}
                    branch={currBranch}
                    setBranch={branch => setBranchState(prev => ({ ...prev, [repo.id]: branch }))}
                  />
                </React.Suspense>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!gitlabConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Gitlab className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Connect your GitLab account to view projects</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div>
      <div className="mb-4 flex">
        <input
          className="border rounded px-2 py-1 w-full text-sm"
          placeholder="Search projects by name or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {filteredGitlabProjects.length === 0 ? (
        <div>
          <p className="text-muted-foreground">No projects found{gitlabProjects.length ? " (filtered)" : ""}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGitlabProjects.map((project) => {
            const currBranch = branchState[project.id] || project.default_branch || 'main';
            return (
              <React.Suspense fallback={<div>Loading...</div>} key={project.id}>
                <GitLabProjectCard
                  project={project}
                  branch={currBranch}
                  setBranch={branch => setBranchState(prev => ({ ...prev, [project.id]: branch }))}
                />
              </React.Suspense>
            );
          })}
        </div>
      )}
    </div>
  );
};

// This file is getting long; further splitting into subcomponents is recommended if changes continue.
