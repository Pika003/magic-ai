
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { GitHubRepository, GitLabProject } from "@/services/versionControlService";
import { Badge } from "@/components/ui/badge";

interface RepoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GitHubRepository | GitLabProject;
  tab: 'github' | 'gitlab';
  isFavorite?: boolean;
}

export const RepoDetailsModal: React.FC<RepoDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  tab,
  isFavorite
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tab === "github" ? (
              <span className="flex items-center gap-2">
                <span className="text-lg font-bold">{(item as any).name}</span>
                {((item as any).archived || (item as any).archived === true) && (
                  <Badge variant="secondary" className="ml-2">Archived</Badge>
                )}
                {isFavorite && (
                  <span className="ml-2 text-yellow-400 font-bold">★ Favorite</span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-lg font-bold">{(item as any).name}</span>
                {((item as any).archived || (item as any).archived === true) && (
                  <Badge variant="secondary" className="ml-2">Archived</Badge>
                )}
                {isFavorite && (
                  <span className="ml-2 text-yellow-400 font-bold">★ Favorite</span>
                )}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {item.description || "No description available"}
          </DialogDescription>
        </DialogHeader>
        {/* GitHub details */}
        {tab === "github" ? (
          <div className="flex flex-col gap-2 text-sm mt-3">
            <div>
              <span className="font-medium mr-2">Full Name:</span>
              {(item as any).full_name || "-"}
            </div>
            <div>
              <span className="font-medium mr-2">Owner:</span>
              {(item as any).owner?.login}
            </div>
            <div>
              <span className="font-medium mr-2">Language:</span>
              {(item as any).language}
            </div>
            <div>
              <span className="font-medium mr-2">Updated:</span>
              {(item as any).updated_at ? new Date((item as any).updated_at).toLocaleString() : "-"}
            </div>
            <div>
              <span className="font-medium mr-2">Clone URL:</span>
              {(item as any).clone_url}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm mt-3">
            <div>
              <span className="font-medium mr-2">Path:</span>
              {(item as any).path_with_namespace}
            </div>
            <div>
              <span className="font-medium mr-2">Namespace:</span>
              {(item as any).namespace?.name ?? "-"}
            </div>
            <div>
              <span className="font-medium mr-2">Language:</span>
              {(item as any).language || "-"}
            </div>
            <div>
              <span className="font-medium mr-2">Updated:</span>
              {(item as any).updated_at
                ? new Date((item as any).updated_at).toLocaleString()
                : ((item as any).last_activity_at
                  ? new Date((item as any).last_activity_at).toLocaleString()
                  : "-")}
            </div>
            <div>
              <span className="font-medium mr-2">HTTP/S URL:</span>
              {(item as any).http_url_to_repo}
            </div>
            <div>
              <span className="font-medium mr-2">SSH URL:</span>
              {(item as any).ssh_url_to_repo}
            </div>
          </div>
        )}
        <DialogClose asChild>
          <button className="mt-6 outline-none border rounded px-4 py-1.5 w-full bg-secondary">Close</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
};
