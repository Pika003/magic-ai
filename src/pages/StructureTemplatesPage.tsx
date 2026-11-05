import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, Save, Copy, RefreshCw, Sparkles, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/apiClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatWithStructureTemplate } from '@/services/openaiService';
import { useUsageTracking } from '@/hooks/useUsageTracking';

const STARTER_PRESETS = [
  {
    name: 'Agile Daily Standup',
    content: "Yesterday:\n- [Tasks completed]\n\nToday:\n- [Tasks planned]\n\nBlockers:\n- [Blockers or 'None']",
  },
  {
    name: 'Weekly Client Digest',
    content: "🚀 Milestones Delivered:\n- [Deliverables completed]\n\n🛠️ In Progress:\n- [Active tasks & items in QA]\n\n📅 Coming Next Week:\n- [Upcoming deliverables]",
  },
  {
    name: 'Changelog / Release Notes',
    content: "## Release Notes\n\n### 🚀 Features\n- [New features]\n\n### 🐛 Bug Fixes\n- [Resolved issues]\n\n### ⚡ Performance\n- [Polish and optimizations]",
  },
  {
    name: 'Bug / Incident Post-Mortem',
    content: "### 🚨 Incident Summary:\n[What happened]\n\n### 🔍 Root Cause:\n[Technical cause]\n\n### 🛠️ Resolution:\n[How it was fixed]\n\n### 🛡️ Preventative Action Items:\n- [ ] [Follow-up task]",
  },
];

interface StructureTemplate {
  id: string;
  name: string;
  template_content: string;
  created_at: string;
}

export const StructureTemplatesPage = () => {
  const [templates, setTemplates] = useState<StructureTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [formattedContent, setFormattedContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { incrementUsage, hasReachedLimit } = useUsageTracking();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await api.get<StructureTemplate[]>('/templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch templates.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter both template name and content.",
        variant: "destructive"
      });
      return;
    }

    try {
      await api.post('/templates', {
        name: newTemplateName,
        templateContent: newTemplateContent,
      });

      setNewTemplateName('');
      setNewTemplateContent('');
      fetchTemplates();

      toast({
        title: "Template Saved! 🎉",
        description: "Your structure template has been saved to your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive"
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await api.delete(`/templates/${id}`);
      fetchTemplates();
      toast({
        title: "Template Deleted",
        description: "Template removed from your profile.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive"
      });
    }
  };

  const applyStructure = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Select a Template",
        description: "Please choose a template to format your content.",
        variant: "destructive"
      });
      return;
    }

    if (!inputContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content to format.",
        variant: "destructive"
      });
      return;
    }

    if (hasReachedLimit) {
      toast({
        title: "Limit Reached",
        description: "You've reached your free limit. Upgrade to unlimited.",
        variant: "destructive"
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      toast({
        title: "Error",
        description: "Selected template not found.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      await incrementUsage('format_with_template');
      const result = await formatWithStructureTemplate(inputContent, template.template_content);
      setFormattedContent(result);
      toast({
        title: "Content Formatted! ✨",
        description: "Your text has been structured according to template.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to format content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-muted-foreground">
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Structure Templates</h1>
          <Badge variant="outline" className="text-xs font-mono">
            {templates.length} Saved
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Create standardized formatting templates for your engineering team, standups, changelogs, and client emails.
        </p>
      </div>

      {/* Create New Template Section */}
      <Card className="border-border/70 shadow-sm bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4 text-indigo-500" />
            <span>Create New Structure Template</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Save custom formatting guidelines that AI can apply to your rough notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Quick-load Industry Presets:
            </label>
            <div className="flex flex-wrap gap-2">
              {STARTER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setNewTemplateName(preset.name);
                    setNewTemplateContent(preset.content);
                    toast({ title: `Loaded "${preset.name}" preset` });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-medium text-foreground">
                Template Name
              </label>
              <Input
                placeholder="e.g. Sprint Review Format"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground">
                Template Structure (Placeholders & Headers)
              </label>
              <Textarea
                placeholder="Define your structure template here..."
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                className="min-h-24 font-mono text-xs resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveTemplate}
              disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
              className="text-xs font-semibold"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Apply Structure Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Format with Template</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Choose a saved template and paste rough text to format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Choose Structure Template
              </label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Raw Input Content
              </label>
              <Textarea
                placeholder="Paste or write your unformatted thoughts or raw task list here..."
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                className="min-h-36 resize-none text-xs"
              />
            </div>

            <Button
              onClick={applyStructure}
              disabled={isProcessing || !selectedTemplate || !inputContent.trim() || hasReachedLimit}
              className="w-full text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  Formatting Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Apply Template Formatting
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Card */}
        <Card className="border-border/70 shadow-sm bg-card/80 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Formatted Output</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Generated based on selected template schema
              </CardDescription>
            </div>
            {formattedContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(formattedContent)}
                className="h-8 text-xs gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 p-4 rounded-xl border border-border/60 bg-muted/30 font-mono text-xs whitespace-pre-wrap leading-relaxed min-h-[220px]">
              {formattedContent ? (
                formattedContent
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs">
                  Formatted output will appear here after clicking Apply...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Templates List */}
      <Card className="border-border/70 shadow-sm bg-card/80">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Saved Template Library</span>
            <Badge variant="secondary" className="text-xs">
              {templates.length} Templates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No custom templates saved yet. Quick-load one of the industry presets above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-border/70 rounded-xl bg-muted/20 space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      {template.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(template.template_content)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Copy template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTemplate(template.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <pre className="p-3 rounded-lg bg-background border border-border/50 font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-32">
                    {template.template_content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StructureTemplatesPage;
