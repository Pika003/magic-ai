
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Github, Gitlab, Search, Filter } from 'lucide-react';
import { GitHubRepository, GitLabProject } from '@/services/versionControlService';
import { GitHubRepoCard } from './GitHubRepoCard';
import { GitLabProjectCard } from './GitLabProjectCard';
import { RepoDetailsModal } from './RepoDetailsModal';
import { Button } from '@/components/ui/button';

interface RepositoryListProps {
  githubRepos?: GitHubRepository[];
  gitlabProjects?: GitLabProject[];
  githubConnected: boolean;
  gitlabConnected: boolean;
  activeTab: 'github' | 'gitlab';
  error?: string | null;
}

const PAGE_SIZE = 8; // items per page

type SortingOption = "updated" | "name";
const SORT_OPTIONS: { label: string; value: SortingOption }[] = [
  { label: "Recently Updated", value: "updated" },
  { label: "Name (A-Z)", value: "name" },
];

export const RepositoryList: React.FC<RepositoryListProps> = ({
  githubRepos = [],
  gitlabProjects = [],
  githubConnected,
  gitlabConnected,
  activeTab,
  error,
}) => {
  // Universal
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingOption>("updated");
  const [page, setPage] = useState(1);
  const [modalRepo, setModalRepo] = useState<GitHubRepository | GitLabProject | null>(null);

  // Filtering & Sorting (GitHub)
  const filteredGithubRepos = useMemo(() => {
    let filtered = githubRepos;
    if (search.trim())
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (repo.description || '').toLowerCase().includes(search.toLowerCase())
      );
    if (sorting === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sorting === "updated") {
      filtered = [...filtered].sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      });
    }
    return filtered;
  }, [githubRepos, search, sorting]);

  // Filtering & Sorting (GitLab)
  const filteredGitlabProjects = useMemo(() => {
    let filtered = gitlabProjects;
    if (search.trim())
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (project.path_with_namespace || '').toLowerCase().includes(search.toLowerCase())
      );
    if (sorting === "name") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sorting === "updated") {
      filtered = [...filtered].sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      });
    }
    return filtered;
  }, [gitlabProjects, search, sorting]);

  // Pagination
  const paginatedGithubRepos = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredGithubRepos.slice(start, start + PAGE_SIZE);
  }, [filteredGithubRepos, page]);

  const paginatedGitlabProjects = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredGitlabProjects.slice(start, start + PAGE_SIZE);
  }, [filteredGitlabProjects, page]);

  const totalGithubPages = Math.ceil(filteredGithubRepos.length / PAGE_SIZE) || 1;
  const totalGitlabPages = Math.ceil(filteredGitlabProjects.length / PAGE_SIZE) || 1;

  // Modal close
  const closeModal = () => setModalRepo(null);

  // Active platform handling
  if (error) return <div className="text-red-500">{error}</div>;
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
        {/* Filter/Sort Controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              className="border rounded pl-8 pr-2 py-1 w-full text-sm"
              placeholder="Search repositories..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mr-1">Sort</label>
            <select
              className="border rounded px-2 py-1 text-xs"
              value={sorting}
              onChange={e => setSorting(e.target.value as SortingOption)}
            >
              {SORT_OPTIONS.map(s => (
                <option value={s.value} key={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        {/* List */}
        {filteredGithubRepos.length === 0 ? (
          <div>
            <p className="text-muted-foreground">No repositories found{githubRepos.length ? " (filtered)" : ""}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedGithubRepos.map((repo) => (
                <div key={repo.id} className="relative group">
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => setModalRepo(repo)}
                    onKeyDown={e => { if (e.key === "Enter") setModalRepo(repo); }}
                  >
                    <GitHubRepoCard
                      repo={repo}
                      branch={repo.default_branch || "main"}
                      setBranch={() => {}}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination Controls */}
            {totalGithubPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <span className="px-2 text-sm">{page} / {totalGithubPages}</span>
                <Button size="sm" disabled={page === totalGithubPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
        {/* Repository Modal */}
        {modalRepo && (
          <RepoDetailsModal
            item={modalRepo}
            tab="github"
            isOpen={!!modalRepo}
            onClose={closeModal}
          />
        )}
      </div>
    );
  }

  // GitLab tab
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
      {/* Filter/Sort Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            className="border rounded pl-8 pr-2 py-1 w-full text-sm"
            placeholder="Search projects..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mr-1">Sort</label>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={sorting}
            onChange={e => setSorting(e.target.value as SortingOption)}
          >
            {SORT_OPTIONS.map(s => (
              <option value={s.value} key={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* List */}
      {filteredGitlabProjects.length === 0 ? (
        <div>
          <p className="text-muted-foreground">No projects found{gitlabProjects.length ? " (filtered)" : ""}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedGitlabProjects.map((project) => (
              <div key={project.id} className="relative group">
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => setModalRepo(project)}
                  onKeyDown={e => { if (e.key === "Enter") setModalRepo(project); }}
                >
                  <GitLabProjectCard
                    project={project}
                    branch={project.default_branch || "main"}
                    setBranch={() => {}}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {totalGitlabPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="px-2 text-sm">{page} / {totalGitlabPages}</span>
              <Button size="sm" disabled={page === totalGitlabPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
      {/* Project Modal */}
      {modalRepo && (
        <RepoDetailsModal
          item={modalRepo}
          tab="gitlab"
          isOpen={!!modalRepo}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
