import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Gitlab, GitBranch, GitMerge, RotateCcw, Undo2, Plus } from "lucide-react";
import { fetchGitHubRepositories, fetchGitLabProjects, GitHubRepository, GitLabProject } from "@/services/versionControlService";
import { createBranch, mergeBranch, rollbackToCommit, revertCommit, viewCommits } from "@/services/gitActionsService";
import { toast } from "@/hooks/use-toast";

const RepoDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const provider = location.pathname.includes("github") ? "github" : "gitlab";
  const [repo, setRepo] = useState<GitHubRepository | GitLabProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [commits, setCommits] = useState<any[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [commitsError, setCommitsError] = useState<string | null>(null);

  // Fetch repo/project details by id
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      if (provider === "github") {
        const repos = await fetchGitHubRepositories();
        setRepo(repos.find((r) => String(r.id) === id));
      } else {
        const projects = await fetchGitLabProjects();
        setRepo(projects.find((p) => String(p.id) === id));
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id, provider]);

  // Fetch commits when repo is loaded
  useEffect(() => {
    const fetchCommits = async () => {
      if (!repo) return;
      setCommitsLoading(true);
      setCommitsError(null);
      try {
        const data = await viewCommits({ provider, repo });
   
        setCommits(data);
      } catch (e: any) {
        setCommitsError(e.message || "Failed to load commits");
      } finally {
        setCommitsLoading(false);
      }
    };
    fetchCommits();
  }, [repo, provider]);

  // Quick Action handlers (simple prompt for demo, can be replaced with modals/forms)
  const handleCreateBranch = async () => {
    const branchName = prompt("Enter new branch name:");
    if (!branchName || !repo) return;
    try {
      await createBranch({ provider, repo, branchName });
      toast({ title: "Branch Created", description: `Branch '${branchName}' created successfully.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };
  const handleMergeBranch = async () => {
    const sourceBranch = prompt("Source branch:");
    const targetBranch = prompt("Target branch:");
    if (!sourceBranch || !targetBranch || !repo) return;
    try {
      await mergeBranch({ provider, repo, sourceBranch, targetBranch });
      toast({ title: "Branch Merged", description: `Merged '${sourceBranch}' into '${targetBranch}'.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };
  const handleRollbackToCommit = async () => {
    const commitSha = prompt("Commit SHA to rollback to:");
    if (!commitSha || !repo) return;
    try {
      await rollbackToCommit({ provider, repo, commitSha });
      toast({ title: "Rollback Complete", description: `Rolled back to commit ${commitSha}.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };
  const handleRevertCommit = async () => {
    const commitSha = prompt("Commit SHA to revert:");
    if (!commitSha || !repo) return;
    try {
      await revertCommit({ provider, repo, commitSha });
      toast({ title: "Commit Reverted", description: `Reverted commit ${commitSha}.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full h-full pt-10 flex flex-col gap-8 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {provider === "github" ? <Github className="w-5 h-5" /> : <Gitlab className="w-5 h-5" />}
            {provider === "github" ? "GitHub Repository" : "GitLab Project"} Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : repo ? (
            <div className="space-y-2">
              <div className="text-lg font-semibold">{repo.name || repo.full_name}</div>
              {repo.description && <div className="text-muted-foreground">{repo.description}</div>}
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div><strong>ID:</strong> {repo.id}</div>
                {provider === "github" ? (
                  <>
                    <div><strong>Owner:</strong> {repo.owner?.login}</div>
                    <div><strong>Default Branch:</strong> {repo.default_branch}</div>
                    <div><strong>Visibility:</strong> {repo.private ? "Private" : "Public"}</div>
                  </>
                ) : (
                  <>
                    <div><strong>Namespace:</strong> {repo.namespace?.full_path}</div>
                    <div><strong>Default Branch:</strong> {repo.default_branch}</div>
                    <div><strong>Visibility:</strong> {repo.visibility}</div>
                  </>
                )}
                <div><strong>Last Updated:</strong> {repo.updated_at || repo.last_activity_at}</div>
                <div><a href={repo.html_url || repo.web_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View on {provider === "github" ? "GitHub" : "GitLab"}</a></div>
              </div>
            </div>
          ) : (
            <div className="text-destructive">Repository/Project not found.</div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="w-5 h-5 text-blue-500" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleCreateBranch} variant="default" disabled={!repo} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Branch
            </Button>
            <Button onClick={handleMergeBranch} variant="secondary" disabled={!repo} className="flex items-center gap-2">
              <GitMerge className="w-4 h-4" /> Merge Branch
            </Button>
            <Button onClick={handleRollbackToCommit} variant="outline" disabled={!repo} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Rollback to Commit
            </Button>
            <Button onClick={handleRevertCommit} variant="outline" disabled={!repo} className="flex items-center gap-2">
              <Undo2 className="w-4 h-4" /> Revert Commit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RotateCcw className="w-5 h-5 text-purple-500" /> Recent Commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commitsLoading ? (
            <div className="text-muted-foreground">Loading commits...</div>
          ) : commitsError ? (
            <div className="text-destructive">{commitsError}</div>
          ) : commits && commits.length > 0 ? (
            <ul className="space-y-4">
              {commits.slice(0, 10).map((commit, idx) => {
                // Normalize fields for both GitHub and GitLab
                const sha =  commit?.commit?.tree?.sha || commit.sha ;
                const message = commit.commit?.message || commit.title || commit.message;
                const author = commit.commit?.author?.name || commit.author_name || commit.author?.login || commit.author_name || "Unknown";
                const date = commit.commit?.author?.date || commit.created_at || commit.committed_date || commit.date;
                return (
                  <li key={sha || idx} className="rounded border p-4 bg-muted/50 hover:bg-muted transition-all">
                    <div className="font-semibold text-base mb-1">{message}</div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span><strong>SHA:</strong> <span className="font-mono">{sha?.slice(0, 8)}</span></span>
                      <span><strong>Author:</strong> {author}</span>
                      <span><strong>Date:</strong> {date ? new Date(date).toLocaleString() : "-"}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-muted-foreground">No commits found.</div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder Section 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 2 (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">More features will be added here.</div>
        </CardContent>
      </Card>

      {/* Placeholder Section 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 3 (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">More features will be added here.</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepoDetailsPage;
