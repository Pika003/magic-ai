import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Github,
  Gitlab,
  Copy,
  Check,
  Search,
  ExternalLink,
  GitBranch,
  Star,
  GitFork,
  Lock,
  Globe,
  FolderGit2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { GitHubRepository, GitLabProject } from '@/services/versionControlService';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface RepositoryListProps {
  githubRepos?: GitHubRepository[];
  gitlabProjects?: GitLabProject[];
  githubConnected: boolean;
  gitlabConnected: boolean;
  activeTab: 'github' | 'gitlab';
  error?: string | null;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Shell: '#89e051',
  Vue: '#41b883',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
};

export const RepositoryList: React.FC<RepositoryListProps> = ({
  githubRepos = [],
  gitlabProjects = [],
  githubConnected,
  gitlabConnected,
  activeTab,
  error,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm text-center">
        {error}
      </div>
    );
  }

  const handleCopy = (e: React.MouseEvent, text: string, id: string | number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: 'Copied to clipboard!',
      description: 'Clone URL copied successfully.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatUpdateDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return new Date(dateStr).toLocaleDateString();
    }
  };

  // ─── GITHUB LIST ─────────────────────────────────────────────────────────────
  if (activeTab === 'github') {
    if (!githubConnected) {
      return (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Github className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold">GitHub is Not Connected</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Authorize Magic AI with your GitHub account to sync repositories, commits, and use automated DevOps workflows.
          </p>
        </div>
      );
    }

    // Extract unique languages
    const languages = Array.from(
      new Set(githubRepos.map((r) => r.language).filter(Boolean) as string[])
    );

    const filtered = githubRepos.filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        (repo.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (repo.owner?.login || '').toLowerCase().includes(search.toLowerCase());

      const matchesLang = languageFilter === 'All' || repo.language === languageFilter;

      return matchesSearch && matchesLang;
    });

    return (
      <div className="space-y-4">
        {/* Search & Language Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Filter repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {languages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setLanguageFilter('All')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  languageFilter === 'All'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {languages.slice(0, 5).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguageFilter(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    languageFilter === lang
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: LANGUAGE_COLORS[lang] || '#888' }}
                  />
                  <span>{lang}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            No repositories found matching your filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((repo) => {
              const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || '#94a3b8' : null;
              return (
                <Card
                  key={repo.id}
                  onClick={() => navigate(`/version-control/github/${repo.id}`)}
                  className="group cursor-pointer border-border/70 bg-card hover:bg-card/90 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Github className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                        <CardTitle className="text-sm font-bold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {repo.name}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {repo.private ? (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 gap-1 font-medium">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 text-muted-foreground">
                            <Globe className="w-2.5 h-2.5" /> Public
                          </Badge>
                        )}
                        {repo.archived && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            Archived
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardDescription className="text-xs line-clamp-2 mt-1 min-h-[32px]">
                      {repo.description || 'No description provided.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-3 pt-0">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {repo.language && (
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: langColor || '#888' }}
                          />
                          <span>{repo.language}</span>
                        </span>
                      )}

                      {repo.default_branch && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          <GitBranch className="w-3 h-3" />
                          <span>{repo.default_branch}</span>
                        </span>
                      )}

                      {repo.updated_at && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatUpdateDate(repo.updated_at)}</span>
                        </span>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 pb-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {repo.clone_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleCopy(e, repo.clone_url, repo.id)}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          title="Copy git clone URL"
                        >
                          {copiedId === repo.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Clone</span>
                            </>
                          )}
                        </Button>
                      )}

                      {repo.html_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(repo.html_url, '_blank');
                          }}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── GITLAB LIST ─────────────────────────────────────────────────────────────
  if (!gitlabConnected) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#fc6d26] flex items-center justify-center mx-auto">
          <Gitlab className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold">GitLab is Not Connected</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Connect your GitLab account to explore projects, trigger pipeline actions, and manage branches.
        </p>
      </div>
    );
  }

  const filteredProjects = gitlabProjects.filter((project) => {
    return (
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (project.path_with_namespace || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Filter GitLab projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          No GitLab projects found matching your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              onClick={() => navigate(`/version-control/gitlab/${project.id}`)}
              className="group cursor-pointer border-border/70 bg-card hover:bg-card/90 hover:border-orange-500/40 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Gitlab className="w-4 h-4 text-[#fc6d26] shrink-0" />
                    <CardTitle className="text-sm font-bold truncate group-hover:text-orange-500 transition-colors">
                      {project.name}
                    </CardTitle>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {project.visibility === 'private' ? (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 gap-1 font-medium">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 text-muted-foreground">
                        <Globe className="w-2.5 h-2.5" /> Public
                      </Badge>
                    )}
                    {project.archived && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        Archived
                      </Badge>
                    )}
                  </div>
                </div>

                <CardDescription className="text-xs line-clamp-2 mt-1 min-h-[32px]">
                  {project.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-3 pt-0">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {project.default_branch && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      <GitBranch className="w-3 h-3" />
                      <span>{project.default_branch}</span>
                    </span>
                  )}
                  {project.last_activity_at && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatUpdateDate(project.last_activity_at)}</span>
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-3 border-t border-border/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {(project.http_url_to_repo || project.web_url) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleCopy(e, project.http_url_to_repo || project.web_url || '', project.id)}
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === project.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Clone</span>
                        </>
                      )}
                    </Button>
                  )}

                  {project.web_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.web_url, '_blank');
                      }}
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <span className="flex items-center gap-1 text-orange-500 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
