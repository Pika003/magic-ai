import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, Github, Gitlab, Plus, Unlink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVersionControl } from "@/hooks/useVersionControl";
import { RepositoryList } from "@/components/version-control/RepositoryList";
import { ConnectionStatus } from "@/components/version-control/ConnectionStatus";

const handleOAuthStart = async (provider: 'github' | 'gitlab') => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    toast({
      title: "Not Authenticated",
      description: "You need to be signed in to connect your account.",
      variant: "destructive",
    });
    return;
  }

  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indydm9ia2NneG1lbWV4ZXJueG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzQ3OTYsImV4cCI6MjA2NTQ1MDc5Nn0.6GeVPRT-hzf5uliidVKHppOHuKrmPSFrHNK8k6hibeg";

  let endpoint = '';
  if (provider === 'github') {
    endpoint = 'https://wrvobkcgxmemexernxne.supabase.co/functions/v1/github-oauth/start';
  } else {
    endpoint = 'https://wrvobkcgxmemexernxne.supabase.co/functions/v1/gitlab-oauth/start';
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supabaseToken: session.access_token,
      })
    });
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      let description = "Failed to get OAuth URL. Please try again.";
      if (data.error) {
        description = data.path ? `${data.error} (Path: ${data.path})` : data.error;
      }
      toast({
        title: "OAuth Error",
        description: description,
        variant: "destructive"
      });
    }
  } catch (error) {
    toast({
      title: "Connection Error",
      description: "Error connecting to OAuth service.",
      variant: "destructive"
    });
  }
};

export const VersionControlPage = () => {
  const [activeTab, setActiveTab] = useState("github");
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
    handleDisconnect
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

        // If GitLab was just connected, switch to the GitLab tab
        if (provider === 'gitlab') {
          setActiveTab('gitlab');
        }
        // Check connections after successful OAuth
        const timer = setTimeout(() => {
          checkConnections();
        }, 1000);
        // Clean up URL after processing
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
        // Clean up URL after error
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

  if (loading) {
    return (
      <div className="w-full h-full pt-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full pt-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <GitBranch className="w-7 h-7 text-blue-500" />
          Version Control Management
        </h1>
        <p className="text-muted-foreground">
          Manage your GitHub and GitLab repositories, branches, commits, and utilize AI-powered features.
        </p>
      </div>
      
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleOAuthStart("github")}
            className="bg-black text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-gray-900"
            disabled={githubConnected}
          >
            <Github className="w-5 h-5" />
            {githubConnected ? 'GitHub Connected' : 'Connect GitHub'}
          </Button>
          {githubConnected && (
            <Button
              onClick={() => handleDisconnect("github")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Unlink className="w-4 h-4" />
              Disconnect
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleOAuthStart("gitlab")}
            className="bg-[#fca326] text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-[#e09b1f]"
            disabled={gitlabConnected}
          >
            <Gitlab className="w-5 h-5" />
            {gitlabConnected ? 'GitLab Connected' : 'Connect GitLab'}
          </Button>
          {gitlabConnected && (
            <Button
              onClick={() => handleDisconnect("gitlab")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Unlink className="w-4 h-4" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      <ConnectionStatus
        githubConnected={githubConnected}
        gitlabConnected={gitlabConnected}
        onRefresh={checkConnections}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="w-5 h-5" /> GitHub ({githubRepos.length})
          </TabsTrigger>
          <TabsTrigger value="gitlab" className="flex items-center gap-2">
            <Gitlab className="w-5 h-5" /> GitLab ({gitlabProjects.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="github">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  GitHub Repositories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RepositoryList
                  githubRepos={githubRepos}
                  gitlabProjects={[]}
                  githubConnected={githubConnected}
                  gitlabConnected={false}
                  activeTab="github"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="gitlab">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gitlab className="w-5 h-5" />
                  GitLab Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RepositoryList
                  githubRepos={[]}
                  gitlabProjects={gitlabProjects}
                  githubConnected={false}
                  gitlabConnected={gitlabConnected}
                  activeTab="gitlab"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VersionControlPage;
