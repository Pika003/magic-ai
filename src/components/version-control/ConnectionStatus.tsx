import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Github, Gitlab, CheckCircle2, XCircle, RefreshCw, Unlink } from 'lucide-react';

interface ConnectionStatusProps {
  githubConnected: boolean;
  gitlabConnected: boolean;
  onRefresh: () => void;
  refreshing?: boolean;
  onConnectGitHub?: () => void;
  onDisconnectGitHub?: () => void;
  onConnectGitLab?: () => void;
  onDisconnectGitLab?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  githubConnected,
  gitlabConnected,
  onRefresh,
  refreshing = false,
  onConnectGitHub,
  onDisconnectGitHub,
  onConnectGitLab,
  onDisconnectGitLab,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* GitHub Card */}
      <div className="p-4 rounded-xl border border-border/70 bg-card/70 backdrop-blur-sm shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shadow-sm">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">GitHub</span>
              {githubConnected ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] gap-1 py-0 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-border text-muted-foreground text-[10px] gap-1 py-0 font-medium">
                  <XCircle className="w-3 h-3 text-muted-foreground" /> Disconnected
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Sync repositories, commit history, and branches
            </p>
          </div>
        </div>

        <div>
          {githubConnected ? (
            onDisconnectGitHub && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnectGitHub}
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            )
          ) : (
            onConnectGitHub && (
              <Button
                size="sm"
                onClick={onConnectGitHub}
                className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 font-medium shadow-sm"
              >
                Connect GitHub
              </Button>
            )
          )}
        </div>
      </div>

      {/* GitLab Card */}
      <div className="p-4 rounded-xl border border-border/70 bg-card/70 backdrop-blur-sm shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fc6d26] to-[#e24329] text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
            <Gitlab className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">GitLab</span>
              {gitlabConnected ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] gap-1 py-0 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-border text-muted-foreground text-[10px] gap-1 py-0 font-medium">
                  <XCircle className="w-3 h-3 text-muted-foreground" /> Disconnected
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Access self-hosted or cloud GitLab projects
            </p>
          </div>
        </div>

        <div>
          {gitlabConnected ? (
            onDisconnectGitLab && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnectGitLab}
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            )
          ) : (
            onConnectGitLab && (
              <Button
                size="sm"
                onClick={onConnectGitLab}
                className="h-8 text-xs bg-[#fc6d26] hover:bg-[#e24329] text-white font-medium shadow-sm"
              >
                Connect GitLab
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
