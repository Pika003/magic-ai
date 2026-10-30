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
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  generateConventionalCommitWithAI,
  generatePRDescriptionWithAI,
  polishDevTextWithAI,
} from '@/services/openaiService';
import { useUsageTracking } from '@/hooks/useUsageTracking';

export const CorrectSentence = () => {
  const [activeTab, setActiveTab] = useState<'commit' | 'pr' | 'polish'>('commit');

  // ─── Conventional Commit State ─────────────────────────────────────────────
  const [commitSummary, setCommitSummary] = useState('');
  const [commitDiff, setCommitDiff] = useState('');
  const [generatedCommit, setGeneratedCommit] = useState('');
  const [isCommitLoading, setIsCommitLoading] = useState(false);
  const [copiedCommit, setCopiedCommit] = useState(false);

  // ─── PR Description State ──────────────────────────────────────────────────
  const [prTitle, setPrTitle] = useState('');
  const [prChanges, setPrChanges] = useState('');
  const [prTestPlan, setPrTestPlan] = useState('');
  const [prBreaking, setPrBreaking] = useState('');
  const [generatedPR, setGeneratedPR] = useState('');
  const [isPRLoading, setIsPRLoading] = useState(false);
  const [copiedPR, setCopiedPR] = useState(false);

  // ─── Dev Text Polisher State ───────────────────────────────────────────────
  const [devText, setDevText] = useState('');
  const [audience, setAudience] = useState<'non_technical' | 'senior_dev' | 'executive'>('non_technical');
  const [polishedText, setPolishedText] = useState('');
  const [isPolishLoading, setIsPolishLoading] = useState(false);
  const [copiedPolish, setCopiedPolish] = useState(false);

  const { incrementUsage, hasReachedLimit } = useUsageTracking();

  // Helper copy function
  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Generate Conventional Commit ──────────────────────────────────────────
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
        description: 'Upgrade for unlimited AI usage.',
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
      toast({ title: 'Commit message ready!' });
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

  // ─── Generate PR Description ───────────────────────────────────────────────
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
        description: 'Upgrade for unlimited AI usage.',
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
      toast({ title: 'PR description generated!' });
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

  // ─── Polish Dev Text ───────────────────────────────────────────────────────
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
        description: 'Upgrade for unlimited AI usage.',
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
      toast({ title: 'Text polished successfully!' });
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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">PR & Commit Studio</h1>
            <p className="text-sm text-slate-500">
              Transform raw code notes and diffs into Conventional Commits, Pull Request descriptions, and stakeholder-ready communication.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="grid grid-cols-3 max-w-lg mb-4">
          <TabsTrigger value="commit" className="flex items-center gap-2">
            <GitCommit className="w-4 h-4" />
            Conventional Commit
          </TabsTrigger>
          <TabsTrigger value="pr" className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4" />
            PR Description
          </TabsTrigger>
          <TabsTrigger value="polish" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Dev Text Polish
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: CONVENTIONAL COMMIT ──────────────────────────────────── */}
        <TabsContent value="commit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-blue-600" />
                  What did you change?
                </CardTitle>
                <CardDescription>
                  Enter rough notes or paste git diff summary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g. fixed jwt token expiry bug in auth middleware and added refresh handler"
                  value={commitSummary}
                  onChange={(e) => setCommitSummary(e.target.value)}
                  className="min-h-[120px]"
                />

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Optional: Git Diff or File List
                  </label>
                  <Textarea
                    placeholder="paste git status or git diff --stat..."
                    value={commitDiff}
                    onChange={(e) => setCommitDiff(e.target.value)}
                    className="font-mono text-xs min-h-[90px]"
                  />
                </div>

                <Button
                  onClick={handleGenerateCommit}
                  disabled={isCommitLoading || !commitSummary.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isCommitLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Conventional Commit...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Conventional Commit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Commit Result Card */}
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg">Generated Commit</CardTitle>
                  <CardDescription>Follows Conventional Commits 1.0 specification</CardDescription>
                </div>
                {generatedCommit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCommit, setCopiedCommit)}
                  >
                    {copiedCommit ? <Check className="w-4 h-4 text-green-600 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copiedCommit ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {generatedCommit ? (
                  <div className="flex-1 bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap flex flex-col justify-between">
                    <div>{generatedCommit}</div>
                    <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                      Run: <span className="text-green-400 font-semibold">git commit -m "{generatedCommit.split('\n')[0]}"</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-slate-400 text-sm text-center">
                    <GitCommit className="w-8 h-8 mb-2 stroke-1" />
                    Enter changes and click Generate to produce a clean commit message.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 2: PR DESCRIPTION GENERATOR ─────────────────────────────── */}
        <TabsContent value="pr" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitPullRequest className="w-5 h-5 text-purple-600" />
                  PR Details
                </CardTitle>
                <CardDescription>Provide the key elements of your Pull Request.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    PR Title / Feature
                  </label>
                  <Input
                    placeholder="e.g. Add Stripe webhook and upgrade usage limits"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    What Changed? (Bullet points or rough notes)
                  </label>
                  <Textarea
                    placeholder="- Added stripe webhook endpoint to verify payments&#10;- Fixed race condition on profile unlock&#10;- Updated usage counter logic"
                    value={prChanges}
                    onChange={(e) => setPrChanges(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Testing Performed
                  </label>
                  <Input
                    placeholder="e.g. Unit tests passing, verified via Stripe CLI webhook triggers"
                    value={prTestPlan}
                    onChange={(e) => setPrTestPlan(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Breaking Changes (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Deprecated legacy /charge endpoint"
                    value={prBreaking}
                    onChange={(e) => setPrBreaking(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleGeneratePR}
                  disabled={isPRLoading || !prTitle.trim() || !prChanges.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isPRLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Drafting PR Description...
                    </>
                  ) : (
                    <>
                      <FileCode className="w-4 h-4 mr-2" />
                      Generate PR Markdown
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* PR Result Card */}
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg">Markdown Output</CardTitle>
                  <CardDescription>Ready to paste into GitHub or GitLab PR</CardDescription>
                </div>
                {generatedPR && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedPR, setCopiedPR)}
                  >
                    {copiedPR ? <Check className="w-4 h-4 text-green-600 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copiedPR ? 'Copied' : 'Copy Markdown'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {generatedPR ? (
                  <div className="flex-1 bg-slate-50 border p-4 rounded-lg font-mono text-xs text-slate-800 whitespace-pre-wrap overflow-y-auto max-h-[480px]">
                    {generatedPR}
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-slate-400 text-sm text-center">
                    <FileCode className="w-8 h-8 mb-2 stroke-1" />
                    Fill in PR details to generate structured PR documentation.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 3: DEV TEXT POLISHER ────────────────────────────────────── */}
        <TabsContent value="polish" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Dev-to-Human Polisher
                </CardTitle>
                <CardDescription>
                  Translate technical updates into polished, concise language tailored to your audience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-2">
                    Target Audience
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={audience === 'non_technical' ? 'default' : 'outline'}
                      onClick={() => setAudience('non_technical')}
                      className="text-xs"
                    >
                      Non-Technical Client
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={audience === 'executive' ? 'default' : 'outline'}
                      onClick={() => setAudience('executive')}
                      className="text-xs"
                    >
                      Executive Summary
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={audience === 'senior_dev' ? 'default' : 'outline'}
                      onClick={() => setAudience('senior_dev')}
                      className="text-xs"
                    >
                      Peer Engineer
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Your Rough Message or Explanation
                  </label>
                  <Textarea
                    placeholder="e.g. backend failed because db pool got exhausted during the migration script run so api threw 500s"
                    value={devText}
                    onChange={(e) => setDevText(e.target.value)}
                    className="min-h-[140px]"
                  />
                </div>

                <Button
                  onClick={handlePolishDevText}
                  disabled={isPolishLoading || !devText.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isPolishLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Polishing Text...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Polish Communication
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Polished Result Card */}
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg">Polished Output</CardTitle>
                  <CardDescription>
                    Tailored for: <Badge variant="secondary">{audience.replace('_', ' ')}</Badge>
                  </CardDescription>
                </div>
                {polishedText && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(polishedText, setCopiedPolish)}
                  >
                    {copiedPolish ? <Check className="w-4 h-4 text-green-600 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copiedPolish ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {polishedText ? (
                  <div className="flex-1 bg-white border p-4 rounded-lg text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {polishedText}
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-slate-400 text-sm text-center">
                    <Sparkles className="w-8 h-8 mb-2 stroke-1" />
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
