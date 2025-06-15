
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Github, Gitlab, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  githubConnected: boolean;
  gitlabConnected: boolean;
  onRefresh: () => void;
  refreshing?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  githubConnected,
  gitlabConnected,
  onRefresh,
  refreshing = false
}) => {
  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5" />
          <span className="font-medium">GitHub:</span>
          <Badge variant={githubConnected ? "default" : "secondary"} className="flex items-center gap-1">
            {githubConnected ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Gitlab className="w-5 h-5" />
          <span className="font-medium">GitLab:</span>
          <Badge variant={gitlabConnected ? "default" : "secondary"} className="flex items-center gap-1">
            {gitlabConnected ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};
