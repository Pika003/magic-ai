
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Github, Gitlab, GitBranch, GitPullRequest } from "lucide-react";

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

export const VersionControlPage = () => (
  <div className="max-w-4xl mx-auto py-8 flex flex-col gap-8">
    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
      <GitBranch className="w-7 h-7 text-blue-500" />
      Version Control Management
    </h1>
    <p className="text-muted-foreground mb-6">
      Manage your GitHub and GitLab repositories, branches, commits, and utilize AI-powered features.
    </p>
    <Tabs defaultValue="github" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="github" className="flex items-center gap-2">
          <Github className="w-5 h-5" /> GitHub
        </TabsTrigger>
        <TabsTrigger value="gitlab" className="flex items-center gap-2">
          <Gitlab className="w-5 h-5" /> GitLab
        </TabsTrigger>
      </TabsList>
      <TabsContent value="github">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GITHUB_SECTIONS.map((section) => (
            <Card key={section.label}>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <section.icon className="w-5 h-5 text-blue-600" />
                <CardTitle>{section.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{section.desc}</CardDescription>
                {/* Placeholder for future controls */}
                <div className="text-xs text-slate-400 mt-2">Coming soon...</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="gitlab">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GITLAB_SECTIONS.map((section) => (
            <Card key={section.label}>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <section.icon className="w-5 h-5 text-purple-600" />
                <CardTitle>{section.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{section.desc}</CardDescription>
                {/* Placeholder for future controls */}
                <div className="text-xs text-slate-400 mt-2">Coming soon...</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export default VersionControlPage;
