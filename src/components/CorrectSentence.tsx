import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  GitCommit,
  GitPullRequest,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  ShieldAlert,
  Terminal,
  Zap,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  generateConventionalCommitWithAI,
  generatePRDescriptionWithAI,
  polishDevTextWithAI,
} from '@/services/openaiService';
import { useUsageTracking } from '@/hooks/useUsageTracking';

const COMMIT_PRESETS = [
  { label: 'Bug Fix', text: 'fixed issue where razorpay webhook verification was failing because hex encoding was omitted from hmac digest' },
  { label: 'New Feature', text: 'implemented action marketplace with 30+ ci/cd workflow presets for github actions and gitlab ci' },
  { label: 'Refactor', text: 'refactored auth context to use rest api tokens instead of direct supabase client session' },
];

export const CorrectSentence = () => {
  const [activeTab, setActiveTab] = useState<'commit' | 'pr' | 'polish'>('commit');

  // Conventional Commit State
  const [commitSummary, setCommitSummary] = useState('');
  const [commitDiff, setCommitDiff] = useState('');
  const [generatedCommit, setGeneratedCommit] = useState('');
  const [isCommitLoading, setIsCommitLoading] = useState(false);
  const [copiedCommit, setCopiedCommit] = useState(false);

  // PR Description State
  const [prTitle, setPrTitle] = useState('');
  const [prChanges, setPrChanges] = useState('');
  const [prTestPlan, setPrTestPlan] = useState('');
  const [prBreaking, setPrBreaking] = useState('');
  const [generatedPR, setGeneratedPR] = useState('');
  const [isPRLoading, setIsPRLoading] = useState(false);
  const [copiedPR, setCopiedPR] = useState(false);

  // Dev Text Polisher State
  const [devText, setDevText] = useState('');
  const [audience, setAudience] = useState<'non_technical' | 'senior_dev' | 'executive'>('non_technical');
  const [polishedText, setPolishedText] = useState('');
  const [isPolishLoading, setIsPolishLoading] = useState(false);
  const [copiedPolish, setCopiedPolish] = useState(false);

  const { incrementUsage, hasReachedLimit } = useUsageTracking();

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCommit = async () => {
    if (!commitSummary.trim()) {
      toast({
        title: 'Summary required',
        description: 'Please describe the changes or paste your git notes.',
        variant: 'destructive',
      });
      return;
    }
    if (hasReachedLimit) {
      toast({
        title: 'Usage limit reached',
        description: 'Upgrade to unlimited for ₹499.',
        variant: 'destructive',
      });
      return;
    }

    setIsCommitLoading(true);
    try {
      await incrementUsage('generate_conventional_commit');
      const result = await generateConventionalCommitWithAI({
        summary: commitSummary,
        diff: commitDiff,
      });
      setGeneratedCommit(result);
      toast({ title: 'Conventional commit ready! ✨' });
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err.message || 'Error communicating with AI service.',
        variant: 'destructive',
      });
    } finally {
      setIsCommitLoading(false);
    }
  };

  const handleGeneratePR = async () => {
    if (!prTitle.trim() || !prChanges.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both PR title and bullet points of your changes.',
        variant: 'destructive',
      });
      return;
    }
    if (hasReachedLimit) {
      toast({
        title: 'Usage limit reached',
        description: 'Upgrade to unlimited for ₹499.',
        variant: 'destructive',
      });
      return;
    }

    setIsPRLoading(true);
    try {
      await incrementUsage('generate_pr_description');
      const result = await generatePRDescriptionWithAI({
        title: prTitle,
        changes: prChanges,
        breakingChanges: prBreaking,
        testPlan: prTestPlan,
      });
      setGeneratedPR(result);
      toast({ title: 'PR description generated! 🚀' });
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err.message || 'Error generating PR description.',
        variant: 'destructive',
      });
    } finally {
      setIsPRLoading(false);
    }
  };

  const handlePolishDevText = async () => {
    if (!devText.trim()) {
      toast({
        title: 'Text required',
        description: 'Please enter the message or explanation to polish.',
        variant: 'destructive',
      });
      return;
    }
    if (hasReachedLimit) {
      toast({
        title: 'Usage limit reached',
        description: 'Upgrade to unlimited for ₹499.',
        variant: 'destructive',
      });
      return;
    }

    setIsPolishLoading(true);
    try {
      await incrementUsage('polish_dev_text');
      const result = await polishDevTextWithAI({
        text: devText,
        audience,
      });
      setPolishedText(result);
      toast({ title: 'Text polished successfully! ✨' });
    } catch (err: any) {
      toast({
        title: 'Polishing failed',
        description: err.message || 'Error processing your text.',
        variant: 'destructive',
      });
    } finally {
      setIsPolishLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">PR & Commit Studio</h1>
          <Badge variant="outline" className="text-xs font-mono">
            Conventional Commits v1.0
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Transform rough engineering notes and diffs into standardized Conventional Commits, Pull Request descriptions, and client summaries.
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="h-10 bg-muted/60 p-1 border border-border/60 rounded-xl mb-6">
          <TabsTrigger value="commit" className="flex items-center gap-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <GitCommit className="w-3.5 h-3.5" />
            <span>Conventional Commit</span>
          </TabsTrigger>
          <TabsTrigger value="pr" className="flex items-center gap-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>PR Description</span>
          </TabsTrigger>
          <TabsTrigger value="polish" className="flex items-center gap-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dev-to-Human Polish</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: CONVENTIONAL COMMIT ──────────────────────────────────── */}
        <TabsContent value="commit" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-indigo-500" />
                  <span>Changes & Git Notes</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Describe what you changed or pick a quick starter preset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {COMMIT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCommitSummary(preset.text)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Summary of Modifications
                  </label>
                  <Textarea
                    placeholder="e.g. fixed jwt token expiry bug in auth middleware and added refresh handler"
                    value={commitSummary}
                    onChange={(e) => setCommitSummary(e.target.value)}
                    className="min-h-[110px] text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Optional: Git Diff / Status Output
                  </label>
                  <Textarea
                    placeholder="paste git status or git diff --stat..."
                    value={commitDiff}
                    onChange={(e) => setCommitDiff(e.target.value)}
                    className="font-mono text-xs min-h-[80px]"
                  />
                </div>

                <Button
                  onClick={handleGenerateCommit}
                  disabled={isCommitLoading || !commitSummary.trim()}
                  className="w-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
                >
                  {isCommitLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Generating Commit...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Generate Conventional Commit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Commit Result Card */}
            <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>Conventional Commit Output</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Follows feat/fix/chore semantics</CardDescription>
                </div>
                {generatedCommit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCommit, setCopiedCommit)}
                    className="h-8 text-xs gap-1"
                  >
                    {copiedCommit ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCommit ? 'Copied' : 'Copy'}</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {generatedCommit ? (
                  <div className="flex-1 bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap flex flex-col justify-between border border-slate-800">
                    <div className="leading-relaxed">{generatedCommit}</div>
                    <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                      Terminal: <span className="text-emerald-400 font-semibold select-all">git commit -m "{generatedCommit.split('\n')[0]}"</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-muted-foreground text-xs text-center min-h-[220px]">
                    <GitCommit className="w-8 h-8 mb-2 opacity-40" />
                    Enter your change description and click Generate to produce a standardized Conventional Commit.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 2: PR DESCRIPTION GENERATOR ─────────────────────────────── */}
        <TabsContent value="pr" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-purple-500" />
                  <span>Pull Request Context</span>
                </CardTitle>
                <CardDescription className="text-xs">Provide key elements of your pull request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 flex-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    PR Title / Objective
                  </label>
                  <Input
                    placeholder="e.g. Add Razorpay payment gateway and usage caps"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    What Changed? (Bullet points or notes)
                  </label>
                  <Textarea
                    placeholder="- Added razorpay order creation endpoint&#10;- Implemented webhook signature verification&#10;- Added client side checkout modal"
                    value={prChanges}
                    onChange={(e) => setPrChanges(e.target.value)}
                    className="min-h-[100px] text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Testing Performed
                    </label>
                    <Input
                      placeholder="e.g. Tested via Razorpay sandbox"
                      value={prTestPlan}
                      onChange={(e) => setPrTestPlan(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Breaking Changes (Optional)
                    </label>
                    <Input
                      placeholder="e.g. None"
                      value={prBreaking}
                      onChange={(e) => setPrBreaking(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGeneratePR}
                  disabled={isPRLoading || !prTitle.trim() || !prChanges.trim()}
                  className="w-full text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm mt-2"
                >
                  {isPRLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Drafting PR Description...
                    </>
                  ) : (
                    <>
                      <FileCode className="w-3.5 h-3.5 mr-1.5" />
                      Generate PR Markdown
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* PR Result Card */}
            <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-500" />
                    <span>Markdown PR Output</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Formatted for GitHub & GitLab descriptions</CardDescription>
                </div>
                {generatedPR && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedPR, setCopiedPR)}
                    className="h-8 text-xs gap-1"
                  >
                    {copiedPR ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPR ? 'Copied' : 'Copy'}</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {generatedPR ? (
                  <div className="flex-1 bg-slate-950 text-slate-100 border border-slate-800 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap overflow-y-auto max-h-[380px] leading-relaxed">
                    {generatedPR}
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-muted-foreground text-xs text-center min-h-[220px]">
                    <FileCode className="w-8 h-8 mb-2 opacity-40" />
                    Fill in your PR details and click Generate to produce complete markdown documentation.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 3: DEV TEXT POLISHER ────────────────────────────────────── */}
        <TabsContent value="polish" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Dev-to-Human Polisher</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Translate engineering updates into diplomatic language tailored to your audience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">
                    Target Audience
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'non_technical', label: 'Non-Technical Client' },
                      { id: 'executive', label: 'Executive Stakeholder' },
                      { id: 'senior_dev', label: 'Peer Engineer' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAudience(item.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          audience === item.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                            : 'bg-card text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Your Rough Thought or Technical Explanation
                  </label>
                  <Textarea
                    placeholder="e.g. backend failed because db pool got exhausted during the migration script run so api threw 500s"
                    value={devText}
                    onChange={(e) => setDevText(e.target.value)}
                    className="min-h-[130px] text-xs"
                  />
                </div>

                <Button
                  onClick={handlePolishDevText}
                  disabled={isPolishLoading || !devText.trim()}
                  className="w-full text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
                >
                  {isPolishLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Polishing Text...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Polish Communication
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Polished Result Card */}
            <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Polished Output</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tailored for: <Badge variant="secondary" className="capitalize text-[10px] ml-1">{audience.replace('_', ' ')}</Badge>
                  </CardDescription>
                </div>
                {polishedText && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(polishedText, setCopiedPolish)}
                    className="h-8 text-xs gap-1"
                  >
                    {copiedPolish ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPolish ? 'Copied' : 'Copy'}</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {polishedText ? (
                  <div className="flex-1 bg-muted/40 border border-border/60 p-4 rounded-xl text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                    {polishedText}
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-muted-foreground text-xs text-center min-h-[220px]">
                    <Sparkles className="w-8 h-8 mb-2 opacity-40" />
                    Enter your draft and pick an audience to polish your technical communication.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
