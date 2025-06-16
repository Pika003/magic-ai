
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw, Copy, History, Sparkles, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { correctSentenceWithAI } from '@/services/openaiService';
import { Layout } from '@/components/Layout';
import { useUsageTracking } from '@/hooks/useUsageTracking';

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

export const CorrectSentence = () => {
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
      // Track usage before making API call
      const usageSuccess = await incrementUsage('sentence_correction');
      if (!usageSuccess) {
        return; // Usage tracking will show the appropriate error
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

  const processPrompt = async (isRefresh: boolean = false) => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to correct.",
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
      // Track usage before making API call
      const usageSuccess = await incrementUsage('sentence_correction');
      if (!usageSuccess) {
        return;
      }

      // Use the existing correctSentenceWithAI function with a specialized prompt
      const systemPrompt = isRefresh 
        ? 'You are a professional prompt engineer. Transform the given text into a clear, professional, and effective prompt that can be used on other AI platforms. Make it specific, actionable, and well-structured. Provide alternative variations and improvements.'
        : 'You are a professional prompt engineer. Transform the given text into a clear, professional, and effective prompt that can be used on other AI platforms. Make it specific, actionable, and well-structured.';

      const result = await correctSentenceWithAI(`${systemPrompt}\n\nOriginal prompt: ${promptText}`, isRefresh);
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
        title: "Prompt Corrected!",
        description: isRefresh ? "Generated a new professional prompt variation." : "Your prompt has been transformed into a professional format.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to correct prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPrompt(false);
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
            <p className="text-slate-600">Improve sentences and create professional prompts for other AI platforms</p>
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

          {/* Prompt Correction Section */}
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
                    placeholder="Enter your rough prompt idea here... write me a story about a dog"
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
