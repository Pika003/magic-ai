import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Copy } from "lucide-react";
import { BranchDropdown } from "./BranchDropdown";
import { useRepositoryBranches } from "@/hooks/useRepositoryBranches";
import { useLatestCommit } from "@/hooks/useLatestCommit";
import { toast } from "@/hooks/use-toast";
import type { GitHubRepository } from "@/services/versionControlService";
import { useState } from "react";
import { GitGraphModal } from "./GitGraphModal";

interface Props {
  repo: GitHubRepository;
  branch: string;
  setBranch: (branch: string) => void;
}

export const GitHubRepoCard: React.FC<Props> = ({ repo, branch, setBranch }) => {
  const [showGraph, setShowGraph] = useState(false);

  const { branches, loading: branchLoading, error: branchError } = useRepositoryBranches({
    provider: "github",
    owner: repo.owner.login,
    repo: repo.name,
  });
  const { commit, loading: commitLoading } = useLatestCommit({
    provider: "github",
    owner: repo.owner.login,
    repo: repo.name,
    branch: branch,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Clone URL copied to clipboard.",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Github className="w-5 h-5 text-blue-600" />
            {repo.name}
            {repo.archived && <Badge variant="secondary" className="ml-2">Archived</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            {repo.private
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
              value={branch}
              onChange={setBranch}
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
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="bg-slate-100 hover:bg-slate-200 border text-xs font-semibold rounded px-2 py-1"
            onClick={() => setShowGraph(true)}
          >
            View Git Graph
          </button>
        </div>
        <GitGraphModal
          isOpen={showGraph}
          onClose={() => setShowGraph(false)}
          provider="github"
          owner={repo.owner.login}
          repo={repo.name}
          branch={branch}
        />
      </CardContent>
    </Card>
  );
};

export default GitHubRepoCard;
