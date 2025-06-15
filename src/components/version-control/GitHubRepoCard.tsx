
import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { GitHubRepository } from "@/services/versionControlService";

interface Props {
  repo: GitHubRepository;
}

export const GitHubRepoCard: React.FC<Props> = ({ repo }) => {
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
          <div>
            <span className="font-medium mr-2">Default Branch:</span>
            <span>{repo.default_branch || 'main'}</span>
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
};

export default GitHubRepoCard;
