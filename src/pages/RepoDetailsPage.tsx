import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Github,
  Gitlab,
  GitBranch,
  GitMerge,
  RotateCcw,
  Undo2,
  Plus,
  FileText,
  Loader2,
  GitCommitHorizontal,
  RefreshCw,
  Copy,
  CheckCheck,
  Eye,
  Code,
  ArrowLeft,
  ExternalLink,
  Globe,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  fetchGitHubRepositories,
  fetchGitLabProjects,
  GitHubRepository,
  GitLabProject,
} from "@/services/versionControlService";
import {
  createBranch,
  mergeBranch,
  rollbackToCommit,
  revertCommit,
  viewCommits,
} from "@/services/gitActionsService";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDistanceToNow } from "date-fns";

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
  const [previewMode, setPreviewMode] = useState<"rendered" | "raw">("rendered");

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
        toast({
          title: "README Generated! ✨",
          description: "Review your generated documentation below, then commit it.",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "No content returned from AI.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to generate README.",
        variant: "destructive",
      });
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
        commitMessage: "📝 docs: add AI-generated README.md [skip ci]",
      };
      await api.post(`/${provider}/readme-commit`, payload);
      setCommitted(true);
      toast({
        title: "README Committed! 🎉",
        description: "README.md has been committed to your default branch.",
      });
    } catch (err: any) {
      toast({
        title: "Commit Failed",
        description: err.message || "Failed to commit README.",
        variant: "destructive",
      });
    } finally {
      setCommitting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(readmeContent);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/70 shadow-sm bg-card/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>AI README Architect</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs font-mono">
            gpt-4o-mini
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Automatically analyze repository metadata, branch structure, and commit logs to craft a production-grade README.md.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleGenerate}
            disabled={!repo || generating}
            className="h-9 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Generating README...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 mr-2" />
                {readmeContent ? "Regenerate" : "Generate README.md"}
              </>
            )}
          </Button>

          {readmeContent && (
            <>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleCommit}
                disabled={committing || committed}
                size="sm"
                className={`h-9 text-xs gap-1.5 ${
                  committed
                    ? "bg-emerald-600 text-white cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {committing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing...</span>
                  </>
                ) : committed ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Committed to Repo</span>
                  </>
                ) : (
                  <>
                    <GitCommitHorizontal className="w-3.5 h-3.5" />
                    <span>Commit Directly to Repo</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Preview Container */}
        {readmeContent && (
          <div className="rounded-xl border border-border/80 overflow-hidden bg-background">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/80 bg-muted/40">
              <span className="text-xs font-mono text-muted-foreground">README.md</span>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
                <button
                  onClick={() => setPreviewMode("rendered")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    previewMode === "rendered"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
                <button
                  onClick={() => setPreviewMode("raw")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    previewMode === "raw"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code className="w-3 h-3" /> Raw
                </button>
              </div>
            </div>

            {previewMode === "rendered" ? (
              <div className="p-6 max-h-[460px] overflow-y-auto prose dark:prose-invert prose-sm max-w-none text-xs leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {readmeContent}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className="p-4 text-xs font-mono text-slate-100 bg-slate-950 overflow-auto max-h-[460px] leading-relaxed whitespace-pre-wrap">
                {readmeContent}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Repo Details Page ───────────────────────────────────────────────────
export const RepoDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const provider = location.pathname.includes("/github/") ? "github" : "gitlab";

  const [repo, setRepo] = useState<GitHubRepository | GitLabProject | null>(null);
  const [loading, setLoading] = useState(true);

  // Commits state
  const [commits, setCommits] = useState<any[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [commitsError, setCommitsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      if (provider === "github") {
        const repos = await fetchGitHubRepositories();
        setRepo(repos.find((r) => String(r.id) === id) || null);
      } else {
        const projects = await fetchGitLabProjects();
        setRepo(projects.find((p) => String(p.id) === id) || null);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id, provider]);

  useEffect(() => {
    const fetchCommits = async () => {
      if (!repo) return;
      setCommitsLoading(true);
      setCommitsError(null);
      try {
        const data = await viewCommits({ provider, repo });
        setCommits(data || []);
      } catch (e: any) {
        setCommitsError(e.message || "Failed to load commits");
      } finally {
        setCommitsLoading(false);
      }
    };
    fetchCommits();
  }, [repo, provider]);

  const handleCreateBranch = async () => {
    const branchName = prompt("Enter new branch name:");
    if (!branchName || !repo) return;
    try {
      await createBranch({ provider, repo, branchName });
      toast({
        title: "Branch Created",
        description: `Branch '${branchName}' created successfully.`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleMergeBranch = async () => {
    const sourceBranch = prompt("Source branch (e.g. feature/auth):");
    const targetBranch = prompt("Target branch (e.g. main):");
    if (!sourceBranch || !targetBranch || !repo) return;
    try {
      await mergeBranch({ provider, repo, sourceBranch, targetBranch });
      toast({
        title: "Branch Merged",
        description: `Merged '${sourceBranch}' into '${targetBranch}'.`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRollbackToCommit = async () => {
    const commitSha = prompt("Commit SHA to rollback to:");
    if (!commitSha || !repo) return;
    try {
      await rollbackToCommit({ provider, repo, commitSha });
      toast({
        title: "Rollback Complete",
        description: `Rolled back to commit ${commitSha}.`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRevertCommit = async () => {
    const commitSha = prompt("Commit SHA to revert:");
    if (!commitSha || !repo) return;
    try {
      await revertCommit({ provider, repo, commitSha });
      toast({
        title: "Commit Reverted",
        description: `Reverted commit ${commitSha}.`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-muted-foreground font-mono">Loading repository details...</p>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-destructive font-semibold">Repository or Project not found.</p>
        <Button variant="outline" onClick={() => navigate("/version-control")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Version Control
        </Button>
      </div>
    );
  }

  const repoName = (repo as any).name || (repo as any).full_name;
  const isPrivate = (repo as any).private || (repo as any).visibility === "private";
  const defaultBranch = (repo as any).default_branch || "main";
  const webUrl = (repo as any).html_url || (repo as any).web_url;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          onClick={() => navigate("/version-control")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Version Control</span>
        </button>
        <span>/</span>
        <span className="capitalize">{provider}</span>
        <span>/</span>
        <span className="font-semibold text-foreground truncate">{repoName}</span>
      </div>

      {/* Main Repository Header Card */}
      <Card className="border-border/70 shadow-sm bg-card/80">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-muted text-foreground">
                  {provider === "github" ? (
                    <Github className="w-5 h-5" />
                  ) : (
                    <Gitlab className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <span>{repoName}</span>
                    {isPrivate ? (
                      <Badge variant="secondary" className="text-[10px] py-0 px-2 gap-1 font-medium">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 px-2 gap-1 text-muted-foreground">
                        <Globe className="w-2.5 h-2.5" /> Public
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </div>

              {(repo as any).description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                  {(repo as any).description}
                </p>
              )}
            </div>

            {webUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(webUrl, "_blank")}
                className="h-8 text-xs gap-1.5 self-start shrink-0 border-border"
              >
                <span>View on {provider === "github" ? "GitHub" : "GitLab"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Default Branch</span>
              <span className="font-mono font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <GitBranch className="w-3 h-3 text-indigo-500" />
                {defaultBranch}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Provider ID</span>
              <span className="font-mono text-foreground mt-0.5 block">{repo.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Primary Language</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {(repo as any).language || "Multi-language"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Last Updated</span>
              <span className="text-foreground mt-0.5 block">
                {(repo as any).updated_at
                  ? formatDistanceToNow(new Date((repo as any).updated_at), { addSuffix: true })
                  : "-"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI README Generator */}
      <ReadmeGenerator repo={repo} provider={provider} />

      {/* Git Actions Bar */}
      <Card className="border-border/70 shadow-sm bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="w-4 h-4 text-indigo-500" />
            <span>Git Branch Operations</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Trigger branch management directly against this repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={handleCreateBranch}
              size="sm"
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Branch
            </Button>
            <Button
              onClick={handleMergeBranch}
              variant="secondary"
              size="sm"
              className="text-xs gap-1.5"
            >
              <GitMerge className="w-3.5 h-3.5" /> Merge Branch
            </Button>
            <Button
              onClick={handleRollbackToCommit}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Rollback Commit
            </Button>
            <Button
              onClick={handleRevertCommit}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" /> Revert Commit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Commits */}
      <Card className="border-border/70 shadow-sm bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCommitHorizontal className="w-4 h-4 text-purple-500" />
            <span>Recent Commit History</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Latest commits pulled from the repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commitsLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Fetching commits...</span>
            </div>
          ) : commitsError ? (
            <div className="text-xs text-destructive p-3 rounded-lg bg-destructive/10">
              {commitsError}
            </div>
          ) : commits && commits.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {commits.slice(0, 10).map((commit, idx) => {
                const sha = commit?.commit?.tree?.sha || commit.sha || "";
                const message = commit.commit?.message || commit.title || commit.message || "Commit";
                const author =
                  commit.commit?.author?.name ||
                  commit.author_name ||
                  commit.author?.login ||
                  "Author";
                const date =
                  commit.commit?.author?.date ||
                  commit.created_at ||
                  commit.committed_date ||
                  commit.date;

                return (
                  <li key={sha || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">{message}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>by {author}</span>
                        {date && (
                          <>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {sha && (
                      <Badge variant="outline" className="font-mono text-[10px] self-start sm:self-auto py-0 text-muted-foreground">
                        {sha.slice(0, 7)}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground py-6 text-center">
              No recent commits found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RepoDetailsPage;
