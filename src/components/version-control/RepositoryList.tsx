
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Gitlab, ExternalLink, Lock, Globe } from 'lucide-react';
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
  console.log('RepositoryList props:', { githubRepos, gitlabProjects, githubConnected, gitlabConnected, activeTab });
  
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
        {safeGithubRepos.map((repo) => (
          <Card key={repo.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Github className="w-5 h-5 text-blue-600" />
                  {repo.name}
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
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  <p>Default branch: <span className="font-medium">{repo.default_branch}</span></p>
                  <p>Updated: {new Date(repo.updated_at).toLocaleDateString()}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openRepository(repo.html_url)}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // GitLab projects
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
      {safeGitlabProjects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gitlab className="w-5 h-5 text-purple-600" />
                {project.name}
              </CardTitle>
              <Badge variant={project.visibility === 'private' ? 'secondary' : 'outline'}>
                {project.visibility}
              </Badge>
            </div>
            <CardDescription className="text-sm">
              {project.description || 'No description available'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                <p>Path: <span className="font-medium">{project.path_with_namespace}</span></p>
                <p>Updated: {new Date(project.last_activity_at).toLocaleDateString()}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openRepository(project.web_url)}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
