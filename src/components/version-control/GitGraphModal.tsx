
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { GitGraph } from "./GitGraph";

interface GitGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'github' | 'gitlab';
  owner?: string;
  repo?: string;
  projectId?: number;
  branch: string;
}

export const GitGraphModal: React.FC<GitGraphModalProps> = ({
  isOpen,
  onClose,
  provider,
  owner,
  repo,
  projectId,
  branch,
}) => (
  <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Git Graph ({provider === 'github' ? repo : projectId})</DialogTitle>
      </DialogHeader>
      <GitGraph
        provider={provider}
        owner={owner}
        repo={repo}
        projectId={projectId}
        branch={branch}
      />
      <DialogClose asChild>
        <button className="mt-4 outline-none border rounded px-4 py-1.5 w-full bg-secondary">Close</button>
      </DialogClose>
    </DialogContent>
  </Dialog>
);
