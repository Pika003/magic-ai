
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageSquare, RefreshCw, Copy, Send, Lightbulb } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { correctSentenceWithAI, generateProfessionalPromptWithAI } from '@/services/openaiService';
import { Layout } from '@/components/Layout';
import { useUsageTracking } from '@/hooks/useUsageTracking';

interface CorrectedSentence {
  id: string;
  originalText: string;
  correctedText: string;
  createdAt: string;
}

interface GeneratedPrompt {
  id: string;
  keywords: string;
  generatedPrompt: string;
  createdAt: string;
}

export const CorrectSentence = () => {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [corrections, setCorrections] = useState<CorrectedSentence[]>([]);
  
  // Professional Prompt Creation state
  const [promptKeywords, setPromptKeywords] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptHistory, setPromptHistory] = useState<GeneratedPrompt[]>([]);
  
  const { incrementUsage, hasReachedLimit } = useUsageTracking();

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

      const corrected = await correctSentenceWithAI(inputText, isRefresh);
      setCorrectedText(corrected);
      
      toast({
        title: "Sentence Corrected!",
        description: isRefresh ? "Generated a new variation of your corrected sentence." : "Your sentence has been corrected using AI.",
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

  const generatePrompt = async () => {
    if (!promptKeywords.trim()) {
      toast({
        title: "Error",
        description: "Please enter keywords or topic for prompt generation.",
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

    setIsGeneratingPrompt(true);
    
    try {
      const usageSuccess = await incrementUsage('prompt_generation');
      if (!usageSuccess) {
        return;
      }

      const prompt = await generateProfessionalPromptWithAI(promptKeywords);
      setGeneratedPrompt(prompt);
      
      toast({
        title: "Professional Prompt Generated!",
        description: "Your AI prompt has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate prompt. Please check your API key in Profile settings.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleRefresh = () => {
    processSentence(true);
  };

  const saveSentence = () => {
    const newCorrection: CorrectedSentence = {
      id: Date.now().toString(),
      originalText: inputText,
      correctedText: correctedText,
      createdAt: new Date().toLocaleString()
    };

    setCorrections([newCorrection, ...corrections]);
    setInputText('');
    setCorrectedText('');
    
    toast({
      title: "Correction Saved!",
      description: "Your corrected sentence has been saved.",
    });
  };

  const savePrompt = () => {
    const newPrompt: GeneratedPrompt = {
      id: Date.now().toString(),
      keywords: promptKeywords,
      generatedPrompt: generatedPrompt,
      createdAt: new Date().toLocaleString()
    };

    setPromptHistory([newPrompt, ...promptHistory]);
    setPromptKeywords('');
    setGeneratedPrompt('');
    
    toast({
      title: "Prompt Saved!",
      description: "Your generated prompt has been saved.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  return (
      <div className="w-full px-2 md:px-4 pt-10 pl-0 ml-0">
        <div className="w-full mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">AI Content Tools</h1>
            <p className="text-slate-600">Professional prompt creation and instant sentence correction</p>
          </div>

          {/* Professional Prompt Creation Section - Now at top */}
          <Card className="border-slate-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span>Professional Prompt Creation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Side */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Keywords or Topic
                    </label>
                    <Input
                      placeholder="e.g., email marketing, project management, customer service"
                      value={promptKeywords}
                      onChange={(e) => setPromptKeywords(e.target.value)}
                      className="border-slate-200 focus:border-yellow-500"
                    />
                  </div>

                  <Button
                    onClick={generatePrompt}
                    disabled={isGeneratingPrompt || !promptKeywords.trim() || hasReachedLimit}
                    className="w-full bg-yellow-500 hover:bg-yellow-600"
                  >
                    {isGeneratingPrompt ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Generate Professional Prompt
                      </>
                    )}
                  </Button>
                </div>

                {/* Output Side */}
                <div className="space-y-4">
                  <div className="min-h-32 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    {generatedPrompt ? (
                      <div className="text-slate-800 whitespace-pre-wrap">{generatedPrompt}</div>
                    ) : (
                      <p className="text-slate-400 italic">Professional prompt will appear here...</p>
                    )}
                  </div>

                  {generatedPrompt && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={savePrompt}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Save Prompt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedPrompt)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Input/Output Grid for Sentence Correction */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Input Card */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <span>Original Sentence</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your sentence here to be corrected and improved..."
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
                    onClick={handleRefresh}
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
                  <span>AI Corrected Sentence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  {correctedText ? (
                    <div className="text-slate-800 whitespace-pre-wrap">{correctedText}</div>
                  ) : (
                    <p className="text-slate-400 italic">Corrected sentence will appear here...</p>
                  )}
                </div>
                
                {correctedText && (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={saveSentence}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Save Correction
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(correctedText)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prompt History */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-slate-600" />
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
                    <Lightbulb className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No prompts generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {promptHistory.map((prompt) => (
                      <div 
                        key={prompt.id}
                        className="p-3 border border-slate-200 rounded"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">{prompt.createdAt}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(prompt.generatedPrompt)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs font-medium text-yellow-700 mb-1">Keywords: {prompt.keywords}</p>
                        <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800">
                          {prompt.generatedPrompt.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Correction History */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-slate-600" />
                    <span>Correction History</span>
                  </div>
                  <Badge variant="secondary">
                    {corrections.length} corrections
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {corrections.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No corrections yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {corrections.map((correction) => (
                      <div 
                        key={correction.id}
                        className="p-3 border border-slate-200 rounded"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">{correction.createdAt}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(correction.correctedText)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="bg-green-50 p-2 rounded text-xs">
                          <p className="font-medium text-green-700 mb-1">Corrected:</p>
                          <div className="text-green-800">{correction.correctedText}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};
