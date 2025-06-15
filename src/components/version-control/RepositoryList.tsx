
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Gitlab, Copy } from 'lucide-react';
import { GitHubRepository, GitLabProject } from '@/services/versionControlService';
import { toast } from '@/hooks/use-toast';
import { BranchDropdown } from './BranchDropdown';
import { useRepositoryBranches } from '@/hooks/useRepositoryBranches';
import { useLatestCommit } from '@/hooks/useLatestCommit';

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
  // search/filter state
  const [search, setSearch] = useState("");
  // branch selection state (unique per repo/project)
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

  // Github
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
              // Branch info
              const currBranch = branchState[repo.id] || repo.default_branch || 'main';
              const { branches, loading: branchLoading, error: branchError } = useRepositoryBranches({
                provider: "github",
                owner: repo.owner.login,
                repo: repo.name,
              });
              // Latest commit for this branch
              const { commit, loading: commitLoading } = useLatestCommit({
                provider: "github",
                owner: repo.owner.login,
                repo: repo.name,
                branch: currBranch,
              });

              return (
                <Card key={repo.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Github className="w-5 h-5 text-blue-600" />
                        {repo.name}
                        {repo.archived && <Badge variant="secondary" className="ml-2">Archived</Badge>}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {(repo.private)
                          ? <Badge variant="secondary">Private</Badge>
                          : <Badge variant="outline">Public</Badge>}
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {repo.description || 'No description available'}
                    </CardDescription>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <span>{repo.owner?.login || <span className="italic">No owner</span>}</span>
                      {repo.owner?.avatar_url &&
                        <img src={repo.owner.avatar_url} className="w-6 h-6 rounded-full ml-2" alt={repo.owner.login || "owner"} />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-2">
                      <div>
                        <span className="font-medium mr-2">Full Name:</span>
                        <span>{repo.full_name || "-"}</span>
                      </div>
                      {/* Branch Dropdown */}
                      <div>
                        <span className="font-medium mr-2">Branch:</span>
                        <BranchDropdown
                          branches={branches}
                          value={currBranch}
                          onChange={branch => setBranchState(prev => ({ ...prev, [repo.id]: branch }))}
                          loading={branchLoading}
                          error={branchError}
                        />
                      </div>
                      {/* Latest Commit */}
                      <div>
                        <span className="font-medium mr-2">Latest Commit:</span>
                        {commitLoading ? (
                          <span className="italic text-xs">Loading...</span>
                        ) : commit ? (
                          <span>
                            <span className="font-mono">{commit.message.slice(0, 60)}{commit.message.length > 60 ? "..." : ""}</span>
                            <span className="ml-1 text-xs text-slate-400">— {commit.author} ({commit.date ? new Date(commit.date).toLocaleString() : ""})</span>
                          </span>
                        ) : (
                          <span className="italic text-xs">Not available</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium mr-2">Language:</span>
                        <span>{repo.language || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="font-medium mr-2">Updated:</span>
                        <span>{repo.updated_at ? new Date(repo.updated_at).toLocaleString() : '-'}</span>
                      </div>
                      <div>
                        <span className="font-medium mr-2">Clone URL:</span>
                        <span className="break-all">{repo.clone_url}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {repo.html_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(repo.html_url, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <Github className="w-4 h-4" />
                            GitHub
                          </Button>
                        )}
                        {repo.clone_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(repo.clone_url)}
                            title="Copy Clone URL"
                            className="flex items-center gap-1 border ml-0.5"
                          >
                            <Copy className="h-4 w-4" />
                            <span className="pl-1">Copy</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // GitLab
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
            const { branches, loading: branchLoading, error: branchError } = useRepositoryBranches({
              provider: "gitlab",
              projectId: project.id,
            });
            const { commit, loading: commitLoading } = useLatestCommit({
              provider: "gitlab",
              projectId: project.id,
              branch: currBranch,
            });

            return (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gitlab className="w-5 h-5 text-purple-600" />
                      {project.name}
                      {project.archived && <Badge variant="secondary" className="ml-2">Archived</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {(project.visibility === 'private')
                        ? <Badge variant="secondary">Private</Badge>
                        : <Badge variant="outline">Public</Badge>}
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {project.description || 'No description available'}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <span>{project.namespace?.name ?? <span className="italic">-</span>}</span>
                    {project.namespace?.avatar_url &&
                      <img src={project.namespace.avatar_url} className="w-6 h-6 rounded-full ml-2" alt={project.namespace.name || "namespace"} />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-2">
                    <div>
                      <span className="font-medium mr-2">Path with Namespace:</span>
                      <span>{project.path_with_namespace || project.name_with_namespace || '-'}</span>
                    </div>
                    {/* Branch Dropdown */}
                    <div>
                      <span className="font-medium mr-2">Branch:</span>
                      <BranchDropdown
                        branches={branches}
                        value={currBranch}
                        onChange={branch => setBranchState(prev => ({ ...prev, [project.id]: branch }))}
                        loading={branchLoading}
                        error={branchError}
                      />
                    </div>
                    {/* Latest Commit */}
                    <div>
                      <span className="font-medium mr-2">Latest Commit:</span>
                      {commitLoading ? (
                        <span className="italic text-xs">Loading...</span>
                      ) : commit ? (
                        <span>
                          <span className="font-mono">{commit.message.slice(0, 60)}{commit.message.length > 60 ? "..." : ""}</span>
                          <span className="ml-1 text-xs text-slate-400">— {commit.author} ({commit.date ? new Date(commit.date).toLocaleString() : ""})</span>
                        </span>
                      ) : (
                        <span className="italic text-xs">Not available</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium mr-2">Updated:</span>
                      <span>
                        {project.updated_at
                          ? new Date(project.updated_at).toLocaleString()
                          : (project.last_activity_at
                            ? new Date(project.last_activity_at).toLocaleString()
                            : '-')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium mr-2">HTTP/S URL:</span>
                      <span className="break-all">{project.http_url_to_repo || '-'}</span>
                    </div>
                    <div>
                      <span className="font-medium mr-2">SSH URL:</span>
                      <span className="break-all">{project.ssh_url_to_repo || '-'}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {project.web_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(project.web_url, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Gitlab className="w-4 h-4" />
                          GitLab
                        </Button>
                      )}
                      {project.http_url_to_repo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(project.http_url_to_repo)}
                          title="Copy HTTP Clone URL"
                          className="flex items-center gap-1 border ml-0.5"
                        >
                          <Copy className="h-4 w-4" />
                          <span className="pl-1">Copy</span>
                        </Button>
                      )}
                      {project.ssh_url_to_repo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(project.ssh_url_to_repo)}
                          title="Copy SSH URL"
                          className="flex items-center gap-1 border ml-0.5"
                        >
                          <Copy className="h-4 w-4" />
                          <span className="pl-1">Copy</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// This file is getting long; further splitting into subcomponents is recommended if changes continue.

