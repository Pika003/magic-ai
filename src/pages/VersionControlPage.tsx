
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Github,
  Gitlab,
  GitBranch,
  GitPullRequest,
  Plus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GITHUB_SECTIONS = [
  { label: "Repositories", icon: Github, desc: "Manage your GitHub repositories" },
  { label: "Commits", icon: GitBranch, desc: "View and create commits" },
  { label: "Branches", icon: GitBranch, desc: "List and switch branches" },
  { label: "Pull Requests", icon: GitPullRequest, desc: "Pull request management" },
  { label: "Release Notes", icon: Github, desc: "AI-powered release note generation" }
];

const GITLAB_SECTIONS = [
  { label: "Projects", icon: Gitlab, desc: "Manage your GitLab projects" },
  { label: "Commits", icon: GitBranch, desc: "View and create commits" },
  { label: "Branches", icon: GitBranch, desc: "List and switch branches" },
  { label: "Merge Requests", icon: GitPullRequest, desc: "Merge request management" },
  { label: "Pipelines", icon: Gitlab, desc: "CI/CD pipeline integration" }
];

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
      method: "GET",
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
      },
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
  const [newRepoName, setNewRepoName] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [repositories, setRepositories] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

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
      } else if (status === 'error') {
        toast({
          title: `Failed to connect to ${provider}`,
          description: message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
      // Clean up URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Mock data for demonstration
  useEffect(() => {
    setRepositories(["my-awesome-project", "frontend-app", "backend-api"]);
    setBranches(["main", "develop", "feature/auth", "hotfix/bug-123"]);
  }, []);

  const handleAddRepository = () => {
    if (newRepoName.trim()) {
      setRepositories(prev => [...prev, newRepoName.trim()]);
      setNewRepoName("");
      toast({
        title: "Repository Added",
        description: `Repository "${newRepoName}" has been added.`,
      });
    }
  };

  const handleCreateBranch = () => {
    if (newBranchName.trim()) {
      setBranches(prev => [...prev, newBranchName.trim()]);
      setNewBranchName("");
      toast({
        title: "Branch Created",
        description: `Branch "${newBranchName}" has been created.`,
      });
    }
  };

  const handleCommit = () => {
    if (commitMessage.trim()) {
      toast({
        title: "Commit Created",
        description: `Commit: "${commitMessage}" has been created.`,
      });
      setCommitMessage("");
    }
  };

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
        <Button
          onClick={() => handleOAuthStart("github")}
          className="bg-black text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-gray-900"
        >
          <Github className="w-5 h-5" />
          Connect GitHub
        </Button>
        <Button
          onClick={() => handleOAuthStart("gitlab")}
          className="bg-[#fca326] text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-[#e09b1f]"
        >
          <Gitlab className="w-5 h-5" />
          Connect GitLab
        </Button>
      </div>
      
      <Tabs defaultValue="github" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="w-5 h-5" /> GitHub
          </TabsTrigger>
          <TabsTrigger value="gitlab" className="flex items-center gap-2">
            <Gitlab className="w-5 h-5" /> GitLab
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="github">
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="repo-name">Add Repository</Label>
                    <div className="flex gap-2">
                      <Input
                        id="repo-name"
                        placeholder="Repository name"
                        value={newRepoName}
                        onChange={(e) => setNewRepoName(e.target.value)}
                      />
                      <Button onClick={handleAddRepository}>Add</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch-name">Create Branch</Label>
                    <div className="flex gap-2">
                      <Input
                        id="branch-name"
                        placeholder="Branch name"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                      />
                      <Button onClick={handleCreateBranch}>Create</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="commit-msg">Quick Commit</Label>
                    <div className="flex gap-2">
                      <Input
                        id="commit-msg"
                        placeholder="Commit message"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                      />
                      <Button onClick={handleCommit}>Commit</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Repositories List */}
            <Card>
              <CardHeader>
                <CardTitle>Repositories</CardTitle>
                <CardDescription>Your GitHub repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {repositories.map((repo, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Github className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{repo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Branches List */}
            <Card>
              <CardHeader>
                <CardTitle>Branches</CardTitle>
                <CardDescription>Available branches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {branches.map((branch, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{branch}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GITHUB_SECTIONS.map((section) => (
                <Card key={section.label}>
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <section.icon className="w-5 h-5 text-blue-600" />
                    <CardTitle>{section.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{section.desc}</CardDescription>
                    <Button className="mt-3" variant="outline" size="sm">
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="gitlab">
          <div className="space-y-6">
            {/* Quick Actions - Similar to GitHub */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gitlab-repo">Add Project</Label>
                    <div className="flex gap-2">
                      <Input
                        id="gitlab-repo"
                        placeholder="Project name"
                        value={newRepoName}
                        onChange={(e) => setNewRepoName(e.target.value)}
                      />
                      <Button onClick={handleAddRepository}>Add</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gitlab-branch">Create Branch</Label>
                    <div className="flex gap-2">
                      <Input
                        id="gitlab-branch"
                        placeholder="Branch name"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                      />
                      <Button onClick={handleCreateBranch}>Create</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gitlab-commit">Quick Commit</Label>
                    <div className="flex gap-2">
                      <Input
                        id="gitlab-commit"
                        placeholder="Commit message"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                      />
                      <Button onClick={handleCommit}>Commit</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GITLAB_SECTIONS.map((section) => (
                <Card key={section.label}>
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <section.icon className="w-5 h-5 text-purple-600" />
                    <CardTitle>{section.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{section.desc}</CardDescription>
                    <Button className="mt-3" variant="outline" size="sm">
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VersionControlPage;
