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
  const [tone, setTone] = useState<'friendly' | 'executive' | 'milestone'>('friendly');
  const [formattedUpdate, setFormattedUpdate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientUpdates, setClientUpdates] = useState<ClientUpdateRecord[]>([]);
  const [yourName, setYourName] = useState('Your Name');
  const [copied, setCopied] = useState(false);
  const { incrementUsage, hasReachedLimit } = useUsageTracking();

  useEffect(() => {
    if (user?.fullName) {
      setYourName(user.fullName);
    }
    // Load projects
    getProjects().then((data) => setProjects(data || [])).catch(() => {});
  }, [user]);

  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (projectId === 'custom') {
      return;
    }
    const found = projects.find((p) => p.id === projectId);
    if (found) {
      if (found.client_name) setClientName(found.client_name);
      if (found.client_email) setRecipientEmail(found.client_email);
      if (found.live_link) setLiveLink(found.live_link);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const processMessage = async (isRefresh: boolean = false) => {
    if (!originalMessage.trim() || !clientName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a client name and update notes.',
        variant: 'destructive',
      });
      return;
    }

    if (hasReachedLimit) {
      toast({
        title: 'Usage limit reached',
        description: "You've reached your free usage limit. Please upgrade for unlimited access.",
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const usageSuccess = await incrementUsage('generate_client_update');
      if (!usageSuccess) return;

      const contextualMessage = `[Tone: ${tone}]\n${originalMessage}`;
      const generated = await generateClientUpdateWithAI(
        contextualMessage,
        clientName,
        liveLink,
        yourName,
        isRefresh
      );

      setFormattedUpdate(generated);
      toast({
        title: isRefresh ? 'Update Refreshed' : 'Client Update Generated',
        description: 'Review your update and dispatch or copy it below.',
      });
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate client update.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Update copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const saveAndRecordSent = async () => {
    if (!formattedUpdate) return;

    // Record in local history
    const record: ClientUpdateRecord = {
      id: Date.now().toString(),
      projectName: selectedProject?.name,
      clientName,
      originalMessage,
      formattedUpdate,
      liveLink,
      sentAt: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setClientUpdates([record, ...clientUpdates]);

    // If attached to a project in DB, update last_update_sent timestamp
    if (selectedProjectId && selectedProjectId !== 'custom') {
      try {
        await updateProject(selectedProjectId, {
          last_update_sent: new Date().toISOString(),
        });
        toast({
          title: 'Project Status Updated',
          description: `Recorded update for project: ${selectedProject?.name}`,
        });
      } catch (err) {
        console.error('Failed to update project timestamp:', err);
      }
    } else {
      toast({
        title: 'Update Saved',
        description: 'Saved to recent updates history.',
      });
    }
  };

  const getMailToLink = () => {
    if (!formattedUpdate) return '#';
    const subject = encodeURIComponent(
      `Project Progress Update: ${selectedProject?.name || clientName}`
    );
    const body = encodeURIComponent(formattedUpdate);
    const to = recipientEmail ? encodeURIComponent(recipientEmail) : '';
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-500/10 text-green-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Client Update Hub</h1>
            <p className="text-sm text-slate-500">
              Draft polished, milestone-driven communications for clients and link updates directly to your projects.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Project & Client Details
              </span>
              {selectedProject?.last_update_sent && (
                <Badge variant="outline" className="text-xs font-normal">
                  <Calendar className="w-3 h-3 mr-1" />
                  Last sent: {new Date(selectedProject.last_update_sent).toLocaleDateString()}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Select an existing project or enter client details manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Picker */}
            {projects.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Link to Project (Optional)
                </label>
                <Select value={selectedProjectId} onValueChange={handleSelectProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">-- Custom / One-off Client --</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.client_name ? `(${p.client_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Client Name *
                </label>
                <Input
                  placeholder="e.g. Acme Corp / Sarah"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Client Email (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="client@company.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Live Preview / Staging URL (Optional)
              </label>
              <Input
                placeholder="https://staging.yourproject.com"
                value={liveLink}
                onChange={(e) => setLiveLink(e.target.value)}
              />
            </div>

            {/* Tone Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Communication Tone
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={tone === 'friendly' ? 'default' : 'outline'}
                  onClick={() => setTone('friendly')}
                  className="text-xs"
                >
                  Friendly
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={tone === 'executive' ? 'default' : 'outline'}
                  onClick={() => setTone('executive')}
                  className="text-xs"
                >
                  Executive
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={tone === 'milestone' ? 'default' : 'outline'}
                  onClick={() => setTone('milestone')}
                  className="text-xs"
                >
                  Milestone
                </Button>
              </div>
            </div>

            {/* Rough Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Progress Notes & Changes *
              </label>
              <Textarea
                placeholder="e.g. Wrapped up checkout flow, resolved login cookie bug, staging environment updated for QA."
                value={originalMessage}
                onChange={(e) => setOriginalMessage(e.target.value)}
                className="min-h-[110px]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => processMessage(false)}
                disabled={isProcessing || !originalMessage.trim() || !clientName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Update...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Draft Client Update
                  </>
                )}
              </Button>
              {formattedUpdate && (
                <Button
                  variant="outline"
                  onClick={() => processMessage(true)}
                  disabled={isProcessing}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Output Card */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">Generated Client Communication</CardTitle>
              <CardDescription>
                Tone: <Badge variant="secondary">{tone}</Badge>
              </CardDescription>
            </div>
            {formattedUpdate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(formattedUpdate)}
              >
                {copied ? <Check className="w-4 h-4 text-green-600 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            {formattedUpdate ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="p-4 bg-slate-50 border rounded-lg text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                  {formattedUpdate}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={saveAndRecordSent}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Save & Record Sent
                  </Button>
                  <a
                    href={getMailToLink()}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send via Email App
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-slate-400 text-sm text-center">
                <MessageSquare className="w-8 h-8 mb-2 stroke-1" />
                Select a project, type what you worked on, and generate a client-facing update.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History of Sent Updates */}
      {clientUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Updates Sent This Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y text-sm">
              {clientUpdates.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-800">
                      {u.projectName ? `${u.projectName} — ` : ''}{u.clientName}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{u.sentAt}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(u.formattedUpdate)}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
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
