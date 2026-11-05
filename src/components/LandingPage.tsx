import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  Zap,
  Star,
  Code2,
  FileText,
  Server,
  Activity,
  GitCommitHorizontal,
  Github,
  Gitlab,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DEMO_TABS = [
  {
    id: 'marketplace',
    label: 'CI/CD Action Marketplace',
    icon: ShoppingBag,
    title: '.github/workflows/node-ci.yml',
    badge: 'GitHub Action',
    code: `name: Production Node.js CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test`,
    note: 'Browse 30+ verified CI/CD templates and commit directly to your repository with 1 click.',
  },
  {
    id: 'readme',
    label: 'AI README Architect',
    icon: FileText,
    title: 'README.md (Generated)',
    badge: 'AI Documentation',
    code: `# magic-ai-platform

> Modern Developer Operations Platform for Git & CI/CD.

## 🚀 Features
- **Version Control Sync**: Deep GitHub & GitLab repository integration.
- **Action Marketplace**: Pre-configured CI/CD workflow presets.
- **Repository Operations**: Create branches, merge, revert, and rollback.

## 📦 Getting Started
\`\`\`bash
git clone https://github.com/org/repo.git
npm install && npm run dev
\`\`\``,
    note: 'Automatically inspect repository file structure, commits, and metadata to generate rich markdown documentation.',
  },
  {
    id: 'git-actions',
    label: 'Git Operations & Rollback',
    icon: GitBranch,
    title: 'Git Branch & Commit Actions',
    badge: 'Repository Ops',
    code: `# Platform-initiated Git Operations
$ git branch feature/user-auth
✓ Branch created on remote origin

$ git revert c4a89f2 --no-edit
✓ Revert commit generated and pushed

$ git merge feature/user-auth into main
✓ Fast-forward merge verified and completed`,
    note: 'Safely execute branch creation, merges, rollbacks, and commit reverts with audit logs.',
  },
];

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeDemoTab, setActiveDemoTab] = useState(DEMO_TABS[0].id);
  const [copiedDemo, setCopiedDemo] = useState(false);

  const activeDemo = DEMO_TABS.find((t) => t.id === activeDemoTab) || DEMO_TABS[0];

  const handleCopyDemo = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  const features = [
    {
      icon: GitBranch,
      title: 'Repository Hub (GitHub & GitLab)',
      description: 'Connect your GitHub and GitLab organizations. Inspect repositories, branch structures, recent commits, and default branch configurations in one unified dashboard.',
      color: 'from-orange-500/20 to-amber-500/20 text-orange-500',
      badge: 'Core Platform',
    },
    {
      icon: ShoppingBag,
      title: 'CI/CD Action Marketplace',
      description: 'Explore curated workflow templates for Node.js, Docker, Python, Go, Security scans, and automated deployments. Preview YAML and commit directly to your active branches.',
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-500',
      badge: 'DevOps Automation',
    },
    {
      icon: FileText,
      title: 'Repository-Aware AI README Architect',
      description: 'Generate production-grade README.md documentation directly from repository metadata, commit histories, and code dependencies, with one-click direct commit.',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500',
      badge: 'Documentation',
    },
    {
      icon: GitCommitHorizontal,
      title: 'Safe Git Operations & Rollbacks',
      description: 'Create branches, trigger merges, and perform commit reverts and rollbacks through official Git provider integrations with built-in auditability.',
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-500',
      badge: 'Repository Ops',
    },
    {
      icon: Server,
      title: 'VPS Deployment Target (Upcoming)',
      description: 'Designed to connect user-owned Linux VPS servers via a lightweight outbound agent, deploying Docker and Docker Compose services with automated configuration.',
      color: 'from-purple-500/20 to-pink-500/20 text-purple-500',
      badge: 'Roadmap',
    },
    {
      icon: Activity,
      title: 'Application & HTTP Monitoring (Upcoming)',
      description: 'Hybrid monitoring combining server metrics with external HTTP uptime health checks to keep your applications running reliably.',
      color: 'from-rose-500/20 to-red-500/20 text-rose-500',
      badge: 'Roadmap',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Background Glowing Mesh & Grids */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-60 dark:opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-radial-glow pointer-events-none" />

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 pt-20 pb-20 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Developer Operations Platform</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            One Platform.{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Your Entire Development Workflow.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal">
            Connect your GitHub and GitLab repositories, inspect branches and commits, generate automated documentation, and commit battle-tested CI/CD workflows in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            {user ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate('/version-control')}
                  className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-indigo-500/25 rounded-xl gap-2"
                >
                  <GitBranch className="w-5 h-5" />
                  <span>Version Control Hub</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/action-marketplace')}
                  className="h-12 px-7 text-base font-medium rounded-xl border-border bg-card/60 hover:bg-muted gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  <span>Action Marketplace</span>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-indigo-500/25 rounded-xl gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="w-full sm:w-auto h-12 px-7 text-base font-medium rounded-xl border-border bg-card/60 hover:bg-muted"
                >
                  <span>Sign In</span>
                </Button>
              </>
            )}
          </div>

          {/* Micro trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Official GitHub & GitLab Integration
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Curated CI/CD Workflow Marketplace
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Safe By Default Operations
            </span>
          </div>
        </div>

        {/* Interactive Live Demo Preview Box */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Window title bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">devops-console.yaml</span>
              </div>

              {/* Demo Tabs */}
              <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border/60">
                {DEMO_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeDemoTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDemoTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code editor view */}
            <div className="p-6 space-y-4 bg-slate-950 text-slate-100 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-semibold">{activeDemo.title}</span>
                  <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                    {activeDemo.badge}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyDemo(activeDemo.code)}
                  className="h-7 px-2 text-xs gap-1 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  {copiedDemo ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </Button>
              </div>

              <pre className="overflow-x-auto max-h-[300px] leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                {activeDemo.code}
              </pre>

              <div className="pt-3 border-t border-slate-800 text-slate-400 font-sans text-xs flex items-center justify-between">
                <span>{activeDemo.note}</span>
                <span className="text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer" onClick={() => navigate('/action-marketplace')}>
                  <span>Explore templates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-4xl mx-auto">
          {[
            { metric: 'GitHub & GitLab', label: 'Multi-Provider Integration', sub: 'Unified repository management' },
            { metric: '30+ Workflows', label: 'CI/CD Action Catalog', sub: 'Pre-configured test & deploy presets' },
            { metric: 'Safe by Default', label: 'Approval-based Execution', sub: 'Auditable operations & rollbacks' },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-border/70 bg-card/50 backdrop-blur-sm text-center space-y-1"
            >
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {stat.metric}
              </p>
              <p className="text-xs font-semibold text-foreground">{stat.label}</p>
              <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="mt-28 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Repository-Centric Developer Operations
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              A unified operational layer across Git providers and CI/CD pipelines to streamline repository-to-production workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group relative border-border/70 bg-card/70 hover:bg-card hover:border-indigo-500/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${feature.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Pricing / Lifetime Deal Section */}
        <div className="mt-28 max-w-3xl mx-auto">
          <div className="relative rounded-3xl p-8 sm:p-10 border border-indigo-500/30 bg-gradient-to-br from-card via-card to-indigo-950/20 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/80">
              <div>
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold mb-2 text-xs">
                  ⚡ Lifetime Pro Access
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  One Payment. Unlimited DevOps Automation.
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Connect unlimited repositories and commit CI/CD workflows without recurring fees.
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-xs text-muted-foreground line-through mr-2">₹1,999</span>
                <span className="text-4xl font-extrabold text-foreground tracking-tight">₹499</span>
                <p className="text-[11px] text-emerald-500 font-semibold">One-time payment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-6 text-xs text-foreground">
              {[
                'Unlimited GitHub & GitLab repository sync',
                'Full CI/CD Action Marketplace access (Node, Docker, Cloud)',
                'AI README Architect with direct branch commit',
                'Repository branch operations (create, merge, revert, rollback)',
                'Priority access to upcoming VPS deployment agent',
                '100% secure Razorpay checkout (UPI, Cards, NetBanking)',
              ].map((perk, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/payment' : '/auth')}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 rounded-xl"
              >
                <span>Unlock Lifetime Pro for ₹499</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-center text-[11px] text-muted-foreground mt-3">
                Instant license activation • 100% verified Razorpay checkout
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-8 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="font-semibold text-foreground">Magic AI</span>
            <span>— SaaS Developer Operations Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/version-control')} className="hover:text-foreground transition-colors">
              Version Control
            </button>
            <button onClick={() => navigate('/action-marketplace')} className="hover:text-foreground transition-colors">
              Action Marketplace
            </button>
            <button onClick={() => navigate('/payment')} className="hover:text-foreground transition-colors">
              Lifetime Deal
            </button>
            <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">
              Sign In
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
