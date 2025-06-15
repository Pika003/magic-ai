
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw, Copy, History, Sparkles } from 'lucide-react';
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

export const CorrectSentence = () => {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<CorrectionHistory[]>([]);
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

  const handleRefresh = () => {
    processSentence(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Corrected text copied to clipboard.",
    });
  };

  const saveCorrection = () => {
    toast({
      title: "Correction Saved!",
      description: "Your correction has been saved to history.",
    });
  };

  return (
    <Layout>
      <div className="w-full px-2 md:px-4 pt-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Correct Sentence</h1>
            <p className="text-slate-600">AI-powered sentence correction with grammar and style improvements</p>
          </div>

          {/* Main Input/Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                    <div className="flex space-x-2">
                      <Button 
                        onClick={saveCorrection}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
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

          {/* History Section */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-slate-600" />
                  <span>Correction History</span>
                </div>
                <Badge variant="secondary">
                  {history.length} corrections
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No corrections yet</p>
                  <p className="text-slate-400 text-sm mt-2">Start correcting sentences to see your history here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div 
                      key={entry.id}
                      className="p-4 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-500">{entry.timestamp}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(entry.correctedText)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-3 rounded border">
                          <p className="text-sm font-medium text-slate-700 mb-1">Original:</p>
                          <div className="text-slate-600 text-sm">{entry.originalText}</div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-sm font-medium text-green-700 mb-1">Corrected:</p>
                          <div className="text-green-800 text-sm">{entry.correctedText}</div>
                        </div>
                        
                        {entry.improvements.length > 0 && (
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-sm font-medium text-blue-700 mb-2">Improvements:</p>
                            <ul className="space-y-1">
                              {entry.improvements.map((improvement, index) => (
                                <li key={index} className="text-sm text-blue-600 flex items-start space-x-2">
                                  <CheckCircle className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
