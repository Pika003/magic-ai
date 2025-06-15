import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gitlab, Copy } from "lucide-react";
import { BranchDropdown } from "./BranchDropdown";
import { useRepositoryBranches } from "@/hooks/useRepositoryBranches";
import { useLatestCommit } from "@/hooks/useLatestCommit";
import { toast } from "@/hooks/use-toast";
import type { GitLabProject } from "@/services/versionControlService";
import { useState } from "react";
import { GitGraphModal } from "./GitGraphModal";

interface Props {
  project: GitLabProject;
  branch: string;
  setBranch: (branch: string) => void;
}

export const GitLabProjectCard: React.FC<Props> = ({ project, branch, setBranch }) => {
  const [showGraph, setShowGraph] = useState(false);

  const { branches, loading: branchLoading, error: branchError } = useRepositoryBranches({
    provider: "gitlab",
    projectId: project.id,
  });
  const { commit, loading: commitLoading } = useLatestCommit({
    provider: "gitlab",
    projectId: project.id,
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
          provider="gitlab"
          projectId={project.id}
          branch={branch}
        />
      </CardContent>
    </Card>
  );
};

export default GitLabProjectCard;
