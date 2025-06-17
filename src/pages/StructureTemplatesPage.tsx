
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit2, Trash2, Save, Copy, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatWithStructureTemplate } from '@/services/openaiService';
import { useUsageTracking } from '@/hooks/useUsageTracking';

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
  const { incrementUsage, hasReachedLimit } = useUsageTracking();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('structure_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('structure_templates')
        .insert({
          user_id: user.id,
          name: newTemplateName,
          template_content: newTemplateContent
        });

      if (error) throw error;

      setNewTemplateName('');
      setNewTemplateContent('');
      fetchTemplates();

      toast({
        title: "Template Saved!",
        description: "Your structure template has been saved successfully.",
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
      const { error } = await supabase
        .from('structure_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchTemplates();
      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully.",
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
    if (!selectedTemplate || !inputContent.trim()) {
      toast({
        title: "Error",
        description: "Please select a template and enter content to format.",
        variant: "destructive"
      });
      return;
    }

    if (hasReachedLimit) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your usage limit. Please upgrade to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) return;

      const usageSuccess = await incrementUsage('structure_application');
      if (!usageSuccess) {
        return;
      }

      const formatted = await formatWithStructureTemplate(inputContent, template.template_content);
      setFormattedContent(formatted);

      toast({
        title: "Content Formatted!",
        description: "Your content has been formatted according to the selected structure template.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to format content. Please check your API key in Profile settings.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 md:px-4 pt-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Structure Templates</h1>
          <p className="text-slate-600">Create and manage structure templates to format your content consistently</p>
        </div>

        {/* Create New Template Section */}
        <Card className="border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-500" />
              <span>Create New Structure Template</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Template Name
              </label>
              <Input
                placeholder="e.g., Email Format, Report Structure, Meeting Notes"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="border-slate-200 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Template Structure
              </label>
              <Textarea
                placeholder="Define your structure template here... e.g., 
Subject: [Main Topic]
Introduction: [Brief overview]
Key Points:
- [Point 1]
- [Point 2]
Conclusion: [Summary and next steps]"
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
              />
            </div>

            <Button
              onClick={saveTemplate}
              disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </CardContent>
        </Card>

        {/* Apply Structure Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Input Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-500" />
                <span>Apply Structure Template</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Template
                </label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="border-slate-200 focus:border-green-500">
                    <SelectValue placeholder="Choose a structure template" />
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

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Your Content
                </label>
                <Textarea
                  placeholder="Enter your content here to be formatted according to the selected structure..."
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  className="min-h-32 resize-none border-slate-200 focus:border-green-500"
                />
              </div>

              <Button
                onClick={applyStructure}
                disabled={isProcessing || !selectedTemplate || !inputContent.trim() || hasReachedLimit}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Apply Structure
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span>Formatted Content</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-32 p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                {formattedContent ? (
                  <div className="text-slate-800 whitespace-pre-wrap">{formattedContent}</div>
                ) : (
                  <p className="text-slate-400 italic">Formatted content will appear here...</p>
                )}
              </div>

              {formattedContent && (
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(formattedContent)}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Formatted Content
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Saved Templates Section */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-slate-600" />
                <span>Saved Templates</span>
              </div>
              <Badge variant="secondary">
                {templates.length} templates
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No templates saved yet</p>
                <p className="text-slate-400 text-sm mt-2">Create your first structure template to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-800">{template.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-500">
                          {new Date(template.created_at).toLocaleDateString()}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(template.template_content)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <div className="text-slate-800 text-sm whitespace-pre-wrap">
                        {template.template_content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
