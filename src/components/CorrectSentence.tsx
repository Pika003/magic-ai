
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw, Copy, History, Sparkles, MessageSquare, Save, Settings, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { correctSentenceWithAI } from '@/services/openaiService';
import { Layout } from '@/components/Layout';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CorrectionHistory {
  id: string;
  originalText: string;
  correctedText: string;
  improvements: string[];
  timestamp: string;
}

interface PromptHistory {
  id: string;
  originalPrompt: string;
  correctedPrompt: string;
  timestamp: string;
}

interface StructureTemplate {
  id: string;
  name: string;
  template_content: string;
  created_at: string;
}

export const CorrectSentence = () => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<CorrectionHistory[]>([]);
  
  // Prompt correction state
  const [promptText, setPromptText] = useState('');
  const [correctedPrompt, setCorrectedPrompt] = useState('');
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);
  
  // Structure state
  const [structureTemplates, setStructureTemplates] = useState<StructureTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [structuredInputText, setStructuredInputText] = useState('');
  const [structuredOutput, setStructuredOutput] = useState('');
  const [isProcessingStructured, setIsProcessingStructured] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  
  const { incrementUsage, hasReachedLimit } = useUsageTracking();

  useEffect(() => {
    if (user) {
      fetchStructureTemplates();
    }
  }, [user]);

  const fetchStructureTemplates = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('structure_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching structure templates:', error);
        return;
      }

      setStructureTemplates(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveStructureTemplate = async () => {
    if (!user || !newTemplateName.trim() || !newTemplateContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter both template name and content.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingTemplate(true);
    
    try {
      const { error } = await supabase
        .from('structure_templates')
        .insert({
          user_id: user.id,
          name: newTemplateName,
          template_content: newTemplateContent
        });

      if (error) {
        throw error;
      }

      setNewTemplateName('');
      setNewTemplateContent('');
      await fetchStructureTemplates();
      
      toast({
        title: "Template Saved!",
        description: "Your structure template has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const deleteStructureTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('structure_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        throw error;
      }

      await fetchStructureTemplates();
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('');
      }
      
      toast({
        title: "Template Deleted",
        description: "Structure template has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const processWithStructure = async () => {
    if (!structuredInputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to process with the structure.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplateId) {
      toast({
        title: "Error",
        description: "Please select a structure template first.",
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

    setIsProcessingStructured(true);
    
    try {
      const usageSuccess = await incrementUsage('sentence_correction');
      if (!usageSuccess) {
        return;
      }

      const selectedTemplate = structureTemplates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) {
        throw new Error('Selected template not found');
      }

      const structurePrompt = `Apply the following structure/template to the given content. Transform the input according to the structure requirements while maintaining the original meaning and improving clarity. Return ONLY the transformed content without any explanations, metadata, or JSON formatting.

Structure Template:
${selectedTemplate.template_content}

Content to transform:
${structuredInputText}

Important: Provide only the final transformed content as plain text.`;

      const result = await correctSentenceWithAI(structurePrompt, false);
      setStructuredOutput(result.correctedText);
      
      toast({
        title: "Content Structured!",
        description: "Your content has been transformed according to the selected structure.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process content with structure. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingStructured(false);
    }
  };

  const processPrompt = async (isRefresh: boolean = false) => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to improve.",
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

    setIsProcessingPrompt(true);
    
    try {
      const usageSuccess = await incrementUsage('sentence_correction');
      if (!usageSuccess) {
        return;
      }

      const promptImprovementText = `Transform this rough prompt idea into a clear, professional, and effective prompt that can be used with AI assistants like ChatGPT, Claude, or other AI platforms. Make it specific, actionable, and well-structured with proper context and instructions. Return ONLY the improved professional prompt without any explanations, introductions, or JSON formatting.

Original rough prompt: "${promptText}"

Important: Provide only the professional prompt as plain text.`;

      const result = await correctSentenceWithAI(promptImprovementText, isRefresh);
      setCorrectedPrompt(result.correctedText);
      
      // Add to prompt history
      const newEntry: PromptHistory = {
        id: Date.now().toString(),
        originalPrompt: promptText,
        correctedPrompt: result.correctedText,
        timestamp: new Date().toLocaleString()
      };
      setPromptHistory(prev => [newEntry, ...prev]);
      
      toast({
        title: "Prompt Improved!",
        description: isRefresh ? "Generated a new professional prompt variation." : "Your prompt has been transformed into a professional format.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to improve prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPrompt(false);
    }
  };

  const processSentence = async (isRefresh: boolean = false) => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence to correct.",
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
      const usageSuccess = await incrementUsage('sentence_correction');
      if (!usageSuccess) {
        return;
      }

      const result = await correctSentenceWithAI(inputText, isRefresh);
      setCorrectedText(result.correctedText);
      setImprovements(result.improvements);
      
      // Add to history
      const newEntry: CorrectionHistory = {
        id: Date.now().toString(),
        originalText: inputText,
        correctedText: result.correctedText,
        improvements: result.improvements,
        timestamp: new Date().toLocaleString()
      };
      setHistory(prev => [newEntry, ...prev]);
      
      toast({
        title: "Sentence Corrected!",
        description: isRefresh ? "Generated a new correction for your sentence." : "Your sentence has been corrected and improved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to correct sentence. Please check your API key in Profile settings.",
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
      description: "Text copied to clipboard.",
    });
  };

  return (
    <Layout>
      <div className="w-full px-2 md:px-4 pt-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">AI Text & Prompt Corrector</h1>
            <p className="text-slate-600">Create professional prompts, apply custom structures, and improve sentences</p>
          </div>

          {/* Professional Prompt Creation Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Professional Prompt Creation</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prompt Input Card */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    <span>Original Prompt</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter your rough prompt idea here... e.g., 'write me a story about a dog'"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="min-h-32 resize-none border-slate-200 focus:border-purple-500"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={() => processPrompt(false)}
                      disabled={isProcessingPrompt || !promptText.trim() || hasReachedLimit}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      {isProcessingPrompt ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Create Professional Prompt
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => processPrompt(true)}
                      disabled={isProcessingPrompt || !promptText.trim() || hasReachedLimit}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Prompt Output Card */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                    <span>Professional Prompt</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-32 p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                    {correctedPrompt ? (
                      <div className="text-slate-800 whitespace-pre-wrap">{correctedPrompt}</div>
                    ) : (
                      <p className="text-slate-400 italic">Professional prompt will appear here...</p>
                    )}
                  </div>
                  
                  {correctedPrompt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(correctedPrompt)}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Professional Prompt
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Custom Structure Application Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Custom Structure Application</h2>
            
            {/* Structure Template Management */}
            <div className="mb-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-orange-500" />
                    <span>Manage Structure Templates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Template Name</label>
                      <Input
                        placeholder="e.g., Blog Post Structure"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Template Content</label>
                      <Textarea
                        placeholder="e.g., 1. Introduction 2. Main Points 3. Conclusion"
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                        className="min-h-20 resize-none"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={saveStructureTemplate}
                    disabled={isSavingTemplate || !newTemplateName.trim() || !newTemplateContent.trim()}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isSavingTemplate ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Save Template
                      </>
                    )}
                  </Button>
                  
                  {structureTemplates.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium mb-2 block">Saved Templates</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {structureTemplates.map((template) => (
                          <div key={template.id} className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded">
                            <div>
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">{template.template_content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteStructureTemplate(template.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Structure Application */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Template Selection */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-500" />
                    <span>Select Template</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a structure template" />
                    </SelectTrigger>
                    <SelectContent>
                      {structureTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedTemplateId && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium mb-1">Selected Template:</p>
                      <p className="text-sm text-blue-600">
                        {structureTemplates.find(t => t.id === selectedTemplateId)?.template_content}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Structure Input Card */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    <span>Content to Structure</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter your content here to apply the selected structure..."
                    value={structuredInputText}
                    onChange={(e) => setStructuredInputText(e.target.value)}
                    className="min-h-32 resize-none border-slate-200 focus:border-green-500"
                  />
                  
                  <Button 
                    onClick={processWithStructure}
                    disabled={isProcessingStructured || !structuredInputText.trim() || !selectedTemplateId || hasReachedLimit}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    {isProcessingStructured ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Apply Structure
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Structure Output Card */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span>Structured Content</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-32 p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                    {structuredOutput ? (
                      <div className="text-slate-800 whitespace-pre-wrap">{structuredOutput}</div>
                    ) : (
                      <p className="text-slate-400 italic">Structured content will appear here...</p>
                    )}
                  </div>
                  
                  {structuredOutput && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(structuredOutput)}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Structured Content
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sentence Correction Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Sentence Correction</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Card */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <span>Original Text</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter your sentence here... The quick brown fox jump over the lazy dog"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={() => processSentence(false)}
                      disabled={isProcessing || !inputText.trim() || hasReachedLimit}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Correct with AI
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => processSentence(true)}
                      disabled={isProcessing || !inputText.trim() || hasReachedLimit}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Output Card */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>AI Corrected Text</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    {correctedText ? (
                      <div className="text-slate-800 whitespace-pre-wrap">{correctedText}</div>
                    ) : (
                      <p className="text-slate-400 italic">Corrected text will appear here...</p>
                    )}
                  </div>
                  
                  {correctedText && (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(correctedText)}
                        className="w-full"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Corrected Text
                      </Button>
                      
                      {improvements.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Improvements Made:</h4>
                          <ul className="space-y-1">
                            {improvements.map((improvement, index) => (
                              <li key={index} className="text-sm text-slate-600 flex items-start space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* History Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentence History */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-slate-600" />
                    <span>Sentence History</span>
                  </div>
                  <Badge variant="secondary">
                    {history.length} corrections
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No corrections yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">{entry.timestamp}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(entry.correctedText)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-slate-600 line-clamp-2">{entry.correctedText}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt History */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span>Prompt History</span>
                  </div>
                  <Badge variant="secondary">
                    {promptHistory.length} prompts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {promptHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No prompts yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {promptHistory.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">{entry.timestamp}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(entry.correctedPrompt)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-slate-600 line-clamp-2">{entry.correctedPrompt}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
