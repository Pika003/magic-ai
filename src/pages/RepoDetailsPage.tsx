import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Gitlab, GitBranch, GitMerge, RotateCcw, Undo2, Plus, FileText, Loader2, GitCommitHorizontal, RefreshCw, Copy, CheckCheck, Eye, Code } from "lucide-react";
import { fetchGitHubRepositories, fetchGitLabProjects, GitHubRepository, GitLabProject } from "@/services/versionControlService";
import { createBranch, mergeBranch, rollbackToCommit, revertCommit, viewCommits } from "@/services/gitActionsService";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── README Generator Component ───────────────────────────────────────────────
interface ReadmeGeneratorProps {
  repo: GitHubRepository | GitLabProject | null;
  provider: "github" | "gitlab";
}

const ReadmeGenerator: React.FC<ReadmeGeneratorProps> = ({ repo, provider }) => {
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"rendered" | "raw">("raw");

  // Derive owner/repo or projectId from the repo object
  const getRequestPayload = () => {
    if (provider === "github") {
      const ghRepo = repo as GitHubRepository;
      return { owner: ghRepo.owner?.login, repo: ghRepo.name };
    } else {
      return { projectId: (repo as GitLabProject).id };
    }
  };

  const handleGenerate = async () => {
    if (!repo) return;
    setGenerating(true);
    setReadmeContent("");
    setCommitted(false);
    try {
      const payload = getRequestPayload();
      const data = await api.post<{ readmeContent: string }>(
        `/${provider}/readme-generate`,
        payload
      );
      if (data?.readmeContent) {
        setReadmeContent(data.readmeContent);
        toast({ title: "README Generated", description: "Review it below, then commit to your repo." });
      } else {
        toast({ title: "Generation Failed", description: "No content returned.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate README.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCommit = async () => {
    if (!repo || !readmeContent) return;
    setCommitting(true);
    try {
      const payload = {
        ...getRequestPayload(),
        readmeContent,
        commitMessage: "📝 Add AI-generated README.md",
      };
      await api.post(`/${provider}/readme-commit`, payload);
      setCommitted(true);
      toast({
        title: "README Committed! 🎉",
        description: `README.md has been committed to ${
          provider === "github"
            ? `${(repo as GitHubRepository).owner?.login}/${(repo as GitHubRepository).name}`
            : (repo as GitLabProject).path_with_namespace || repo.name
        }`,
      });
    } catch (err: any) {
      toast({ title: "Commit Failed", description: err.message || "Failed to commit README.", variant: "destructive" });
    } finally {
      setCommitting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(readmeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-green-500" />
          AI README Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Auto-generate a professional README.md from this repo's metadata and commit history, then commit it directly.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate button */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!repo || generating}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><FileText className="w-4 h-4" /> Generate README</>
            )}
          </Button>

          {readmeContent && (
            <>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </Button>

              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex items-center gap-2"
              >
                {copied ? <><CheckCheck className="w-4 h-4 text-green-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
              </Button>

              <Button
                onClick={handleCommit}
                disabled={committing || committed}
                className={`flex items-center gap-2 ${committed ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white`}
              >
                {committing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Committing...</>
                ) : committed ? (
                  <><CheckCheck className="w-4 h-4" /> Committed!</>
                ) : (
                  <><GitCommitHorizontal className="w-4 h-4" /> Commit to Repo</>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Preview */}
        {readmeContent && (
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewMode("rendered")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                    previewMode === "rendered"
                      ? "bg-white border border-slate-300 text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={() => setPreviewMode("raw")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                    previewMode === "raw"
                      ? "bg-white border border-slate-300 text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> Raw
                </button>
              </div>
              <span className="text-xs text-slate-400">{readmeContent.length} chars · README.md</span>
            </div>

            {/* Rendered markdown */}
            {previewMode === "rendered" ? (
              <div className="p-6 overflow-auto max-h-[600px] prose prose-slate prose-sm max-w-none
                prose-headings:font-bold prose-headings:text-slate-800
                prose-h1:text-2xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-2
                prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-1
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-pink-600
                prose-pre:bg-slate-900 prose-pre:text-slate-100
                prose-blockquote:border-l-blue-400 prose-blockquote:text-slate-600
                prose-strong:text-slate-800
                prose-table:text-sm prose-th:bg-slate-50">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {readmeContent}
                </ReactMarkdown>
              </div>
            ) : (
              /* Raw markdown */
              <pre className="p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono overflow-auto max-h-[600px] leading-relaxed bg-slate-950 text-slate-200">
                {readmeContent}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── RepoDetailsPage ───────────────────────────────────────────────────────────
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

      {/* README Generator */}
      <ReadmeGenerator repo={repo} provider={provider} />

    </div>
  );
};

export default RepoDetailsPage;
