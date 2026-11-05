import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Send,
  MessageSquare,
  RefreshCw,
  Copy,
  ExternalLink,
  Mail,
  Briefcase,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateClientUpdateWithAI } from '@/services/openaiService';
import { getProjects, updateProject } from '@/services/projectService';
import type { Project } from '@/types/project';
import { useAuth } from '@/contexts/AuthContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';

interface ClientUpdateRecord {
  id: string;
  projectName?: string;
  clientName: string;
  originalMessage: string;
  formattedUpdate: string;
  liveLink: string;
  sentAt: string;
}

export const ClientUpdate = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('custom');

  const [clientName, setClientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');
  const [yourName, setYourName] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'executive'>('professional');

  const [formattedUpdate, setFormattedUpdate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [clientUpdates, setClientUpdates] = useState<ClientUpdateRecord[]>([]);
  const { incrementUsage, hasReachedLimit } = useUsageTracking();

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    try {
      const data = await getProjects(user.id);
      setProjects(data);
    } catch {
      // ignore
    }
  };

  const handleProjectSelect = (val: string) => {
    setSelectedProjectId(val);
    if (val === 'custom') {
      setClientName('');
      setRecipientEmail('');
      return;
    }
    const found = projects.find((p) => p.id === val);
    if (found) {
      setClientName(found.client_name || found.name);
      setRecipientEmail(found.client_email || '');
    }
  };

  const processMessage = async (isRefresh: boolean = false) => {
    if (!originalMessage.trim()) {
      toast({
        title: 'Notes required',
        description: 'Please describe the work done or progress made.',
        variant: 'destructive',
      });
      return;
    }
    if (!clientName.trim()) {
      toast({
        title: 'Client name required',
        description: 'Please provide the client or stakeholder name.',
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

    setIsProcessing(true);
    try {
      await incrementUsage('generate_client_update');
      const enhancedMessage = `[Tone: ${tone}]\n${originalMessage}`;

      const result = await generateClientUpdateWithAI(
        enhancedMessage,
        clientName,
        liveLink,
        yourName || user?.email?.split('@')[0] || 'Your Team',
        isRefresh
      );

      setFormattedUpdate(result);
      toast({
        title: isRefresh ? 'Alternative generated!' : 'Client update ready! ✨',
        description: 'Review and send directly or copy to clipboard.',
      });
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err.message || 'Error processing update.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const saveAndRecordSent = async () => {
    const record: ClientUpdateRecord = {
      id: String(Date.now()),
      projectName: selectedProject?.name,
      clientName,
      originalMessage,
      formattedUpdate,
      liveLink,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setClientUpdates([record, ...clientUpdates]);

    if (selectedProjectId !== 'custom') {
      try {
        await updateProject(selectedProjectId, {
          last_update_sent: new Date().toISOString(),
        });
        loadProjects();
      } catch {
        // ignore
      }
    }

    toast({
      title: 'Update recorded! 🎉',
      description: 'Logged to project history.',
    });
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const getMailToLink = () => {
    const subject = encodeURIComponent(
      `Project Progress Update: ${selectedProject ? selectedProject.name : 'Weekly Digest'}`
    );
    const body = encodeURIComponent(formattedUpdate);
    const to = recipientEmail ? encodeURIComponent(recipientEmail) : '';
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Client Progress Hub</h1>
          <Badge variant="outline" className="text-xs font-mono">
            Milestone Communications
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Draft diplomatic, milestone-driven updates for freelance clients and link communications directly to your projects.
        </p>
      </div>

      {/* Main Form & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Card */}
        <Card className="border-border/70 shadow-sm bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span>Project & Client Details</span>
              </span>
              {selectedProject?.last_update_sent && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  <Calendar className="w-3 h-3 mr-1" />
                  Last: {new Date(selectedProject.last_update_sent).toLocaleDateString()}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Link an active project or enter client details manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Link to Project (Optional)
                </label>
                <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">— Custom / Unlisted Project —</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.client_name ? `(${p.client_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Client Name *</label>
                <Input
                  placeholder="e.g. Sarah Jenkins"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Client Email</label>
                <Input
                  placeholder="client@company.com"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Your Name / Team</label>
                <Input
                  placeholder="e.g. Alex (Engineering)"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Live Demo / Staging URL</label>
                <Input
                  placeholder="https://staging.app.dev"
                  value={liveLink}
                  onChange={(e) => setLiveLink(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Communication Tone</label>
              <div className="flex gap-2">
                {[
                  { id: 'professional', label: 'Professional & Polished' },
                  { id: 'casual', label: 'Friendly & Casual' },
                  { id: 'executive', label: 'High-Level Exec' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      tone === t.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Progress Notes & Changes *
              </label>
              <Textarea
                placeholder="e.g. Wrapped up checkout flow, resolved login cookie bug, staging environment updated for QA."
                value={originalMessage}
                onChange={(e) => setOriginalMessage(e.target.value)}
                className="min-h-[100px] text-xs"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => processMessage(false)}
                disabled={isProcessing || !originalMessage.trim() || !clientName.trim()}
                className="flex-1 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating Update...
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Draft Client Update
                  </>
                )}
              </Button>
              {formattedUpdate && (
                <Button
                  variant="outline"
                  onClick={() => processMessage(true)}
                  disabled={isProcessing}
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  title="Generate alternative"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Output Card */}
        <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Generated Client Message</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Tone: <Badge variant="secondary" className="capitalize text-[10px] ml-1">{tone}</Badge>
              </CardDescription>
            </div>
            {formattedUpdate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(formattedUpdate)}
                className="h-8 text-xs gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            {formattedUpdate ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground flex-1">
                  {formattedUpdate}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={saveAndRecordSent}
                    className="flex-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Save & Record Sent
                  </Button>
                  <a
                    href={getMailToLink()}
                    className="inline-flex items-center justify-center rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground h-9 px-4"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    Send via Email App
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-muted-foreground text-xs text-center min-h-[220px]">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                Select a project, type what you worked on, and generate a client-facing update.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History of Sent Updates */}
      {clientUpdates.length > 0 && (
        <Card className="border-border/70 shadow-sm bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Updates Sent This Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60 text-xs">
              {clientUpdates.map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">
                      {u.projectName ? `${u.projectName} — ` : ''}{u.clientName}
                    </span>
                    <span className="text-muted-foreground ml-2 text-[11px]">{u.sentAt}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(u.formattedUpdate)}
                    className="h-7 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
