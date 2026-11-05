import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, Github, Gitlab, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api, getToken } from "@/lib/apiClient";
import { useVersionControl } from "@/hooks/useVersionControl";
import { RepositoryList } from "@/components/version-control/RepositoryList";
import { ConnectionStatus } from "@/components/version-control/ConnectionStatus";
import { Badge } from "@/components/ui/badge";

const handleOAuthStart = async (provider: 'github' | 'gitlab') => {
  const token = getToken();

  if (!token) {
    toast({
      title: "Not Authenticated",
      description: "You need to be signed in to connect your account.",
      variant: "destructive",
    });
    return;
  }

  try {
    const data = await api.get<{ url: string }>(`/${provider}/start`);

    if (data.url) {
      window.location.href = data.url;
    } else {
      toast({
        title: "OAuth Error",
        description: "Failed to get OAuth URL. Please try again.",
        variant: "destructive",
      });
    }
  } catch (error: any) {
    toast({
      title: "Connection Error",
      description: error.message || "Error connecting to OAuth service.",
      variant: "destructive",
    });
  }
};

export const VersionControlPage = () => {
  const [activeTab, setActiveTab] = useState("github");
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    githubRepos,
    gitlabProjects,
    githubConnected,
    gitlabConnected,
    loading,
    checkConnections,
    fetchDataForTab,
    handleDisconnect,
  } = useVersionControl();

  // Handle OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const provider = params.get('provider');
    const message = params.get('message');

    if (status) {
      if (status === 'success') {
        toast({
          title: `Successfully connected to ${provider}`,
          description: `Your ${provider} account has been connected.`,
        });

        if (provider === 'gitlab') {
          setActiveTab('gitlab');
        }
        const timer = setTimeout(() => {
          checkConnections();
        }, 1000);
        const navigateTimer = setTimeout(() => {
          navigate(location.pathname, { replace: true });
        }, 2000);

        return () => {
          clearTimeout(timer);
          clearTimeout(navigateTimer);
        };
      } else if (status === 'error') {
        toast({
          title: `Failed to connect to ${provider}`,
          description: message || 'An unknown error occurred.',
          variant: 'destructive',
        });
        const timer = setTimeout(() => {
          navigate(location.pathname, { replace: true });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [location.search, navigate, checkConnections]);

  // Fetch data when tab changes and we have a connection but no data
  useEffect(() => {
    if (activeTab === 'github' && githubConnected && githubRepos.length === 0) {
      fetchDataForTab('github');
    } else if (activeTab === 'gitlab' && gitlabConnected && gitlabProjects.length === 0) {
      fetchDataForTab('gitlab');
    }
  }, [activeTab, githubConnected, gitlabConnected, githubRepos.length, gitlabProjects.length, fetchDataForTab]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await checkConnections();
      await fetchDataForTab(activeTab as 'github' | 'gitlab');
      toast({ title: 'Refreshed', description: 'Repository list synchronized.' });
    } catch {
      toast({ title: 'Refresh failed', description: 'Could not sync repositories.', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-muted-foreground font-mono">Synchronizing repositories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Version Control</h1>
            <Badge variant="outline" className="text-xs font-mono">
              Git Hub & GitLab
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your Git providers, inspect branches, generate automated AI READMEs, and commit CI/CD workflows.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="h-9 text-xs gap-1.5 self-start sm:self-auto border-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Sync Repos</span>
        </Button>
      </div>

      {/* Provider Connection Cards */}
      <ConnectionStatus
        githubConnected={githubConnected}
        gitlabConnected={gitlabConnected}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        onConnectGitHub={() => handleOAuthStart('github')}
        onDisconnectGitHub={() => handleDisconnect('github')}
        onConnectGitLab={() => handleOAuthStart('gitlab')}
        onDisconnectGitLab={() => handleDisconnect('gitlab')}
      />

      {/* Provider Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-10 bg-muted/60 p-1 border border-border/60 rounded-xl mb-6">
          <TabsTrigger
            value="github"
            className="flex items-center gap-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
            {githubConnected && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1">
                {githubRepos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="gitlab"
            className="flex items-center gap-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Gitlab className="w-4 h-4 text-[#fc6d26]" />
            <span>GitLab</span>
            {gitlabConnected && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1">
                {gitlabProjects.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github" className="mt-0 space-y-4">
          <RepositoryList
            githubRepos={githubRepos}
            gitlabProjects={[]}
            githubConnected={githubConnected}
            gitlabConnected={false}
            activeTab="github"
          />
        </TabsContent>

        <TabsContent value="gitlab" className="mt-0 space-y-4">
          <RepositoryList
            githubRepos={[]}
            gitlabProjects={gitlabProjects}
            githubConnected={false}
            gitlabConnected={gitlabConnected}
            activeTab="gitlab"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VersionControlPage;
