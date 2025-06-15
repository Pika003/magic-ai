
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Gitlab, ExternalLink, Lock, Globe, User, Code2, Share2 } from 'lucide-react';
import { Repository, GitLabProject } from '@/services/versionControlService';

interface RepositoryListProps {
  githubRepos: Repository[];
  gitlabProjects: GitLabProject[];
  githubConnected: boolean;
  gitlabConnected: boolean;
  activeTab: string;
}

export const RepositoryList: React.FC<RepositoryListProps> = ({
  githubRepos,
  gitlabProjects,
  githubConnected,
  gitlabConnected,
  activeTab
}) => {
  const openRepository = (url: string) => {
    window.open(url, '_blank');
  };

  // Ensure we have arrays to work with
  const safeGithubRepos = Array.isArray(githubRepos) ? githubRepos : [];
  const safeGitlabProjects = Array.isArray(gitlabProjects) ? gitlabProjects : [];

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

    if (safeGithubRepos.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Github className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No repositories found</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeGithubRepos.map((repo: any) => (
          <Card key={repo.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Github className="w-5 h-5 text-blue-600" />
                  {repo.name}
                  {repo.archived && (
                    <Badge variant="secondary" className="ml-2">Archived</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {repo.private ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Private
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Public
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="text-sm">
                {repo.description || 'No description available'}
              </CardDescription>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <User className="w-4 h-4" />
                <span>{repo.owner?.login}</span>
                {repo.owner?.avatar_url ? (
                  <img src={repo.owner.avatar_url} className="w-6 h-6 rounded-full ml-2" alt={repo.owner.login} />
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-2">
                <div>
                  <span className="font-medium mr-2">Full Name:</span>
                  <span>{repo.full_name}</span>
                </div>
                <div>
                  <span className="font-medium mr-2">Default Branch:</span>
                  <span>{repo.default_branch}</span>
                </div>
                <div>
                  <span className="font-medium mr-2">Language:</span>
                  <span>{repo.language || 'Unknown'}</span>
                </div>
                <div>
                  <span className="font-medium mr-2">Updated:</span>
                  <span>{repo.updated_at ? new Date(repo.updated_at).toLocaleString() : 'Unknown'}</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRepository(repo.html_url)}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    GitHub
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(repo.clone_url)}
                    title="Copy Clone URL"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // GitLab projects display
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

  if (safeGitlabProjects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Gitlab className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No projects found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {safeGitlabProjects.map((project: any) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gitlab className="w-5 h-5 text-purple-600" />
                {project.name}
                {project.archived && (
                  <Badge variant="secondary" className="ml-2">Archived</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {project.visibility === 'private' ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Public
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-sm">
              {project.description || 'No description available'}
            </CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <User className="w-4 h-4" />
              <span>{project.namespace?.name}</span>
              {project.namespace?.avatar_url ? (
                <img src={project.namespace.avatar_url} className="w-6 h-6 rounded-full ml-2" alt={project.namespace.name} />
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-2">
              <div>
                <span className="font-medium mr-2">Path with Namespace:</span>
                <span>{project.path_with_namespace}</span>
              </div>
              <div>
                <span className="font-medium mr-2">Default Branch:</span>
                <span>{project.default_branch}</span>
              </div>
              <div>
                <span className="font-medium mr-2">Updated:</span>
                <span>{project.last_activity_at ? new Date(project.last_activity_at).toLocaleString() : 'Unknown'}</span>
              </div>
              <div>
                <span className="font-medium mr-2">HTTP/S URL:</span>
                <span className="break-all">{project.http_url_to_repo}</span>
              </div>
              <div>
                <span className="font-medium mr-2">SSH URL:</span>
                <span className="break-all">{project.ssh_url_to_repo}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openRepository(project.web_url)}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  GitLab
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(project.http_url_to_repo)}
                  title="Copy HTTP Clone URL"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(project.ssh_url_to_repo)}
                  title="Copy SSH URL"
                >
                  <Code2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
