import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageSquare, RefreshCw, Copy, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { correctSentenceWithAI } from '@/services/openaiService';
import { Navigation } from '@/components/Navigation';
import { Layout } from '@/components/Layout';

interface CorrectedSentence {
  id: string;
  originalText: string;
  correctedText: string;
  improvements: string[];
  correctedAt: string;
}

export const CorrectSentence = () => {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [correctedSentences, setCorrectedSentences] = useState<CorrectedSentence[]>([]);

  const processText = async (isRefresh: boolean = false) => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to correct.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await correctSentenceWithAI(inputText, isRefresh);
      setCorrectedText(result.correctedText);
      setImprovements(result.improvements);
      
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

  const handleRefresh = () => {
    processText(true);
  };

  const saveCorrection = () => {
    const newCorrection: CorrectedSentence = {
      id: Date.now().toString(),
      originalText: inputText,
      correctedText: correctedText,
      improvements: improvements,
      correctedAt: new Date().toLocaleString()
    };

    setCorrectedSentences([newCorrection, ...correctedSentences]);
    setInputText('');
    setCorrectedText('');
    setImprovements([]);
    
    toast({
      title: "Correction Saved!",
      description: "Your corrected sentence has been saved.",
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
    <Layout>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Correct Sentence</h2>
        <p className="text-slate-600">Instantly improve your sentences with AI-powered corrections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span>Original Text</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="En ter you r tex t he re for cor rec tion..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
            />
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => processText(false)}
                disabled={isProcessing || !inputText.trim()}
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
                disabled={isProcessing || !inputText.trim()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

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
                <div className="text-slate-800">{correctedText}</div>
              ) : (
                <p className="text-slate-400 italic">Corrected text will appear here...</p>
              )}
            </div>
            
            {improvements.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Improvements made:</p>
                <div className="flex flex-wrap gap-1">
                  {improvements.map((improvement, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {improvement}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {correctedText && (
              <div className="flex space-x-2">
                <Button 
                  onClick={saveCorrection}
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

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-slate-600" />
              <span>Correction History</span>
            </div>
            <Badge variant="secondary">
              {correctedSentences.length} corrections
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {correctedSentences.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No corrections yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {correctedSentences.map((correction) => (
                <div 
                  key={correction.id}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500">{correction.correctedAt}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(correction.correctedText)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-slate-700 mb-1">Original:</p>
                    <div className="bg-red-50 p-2 rounded border border-red-200 text-red-800 text-sm">
                      {correction.originalText}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-slate-700 mb-1">Corrected:</p>
                    <div className="bg-green-50 p-2 rounded border border-green-200 text-green-800 text-sm">
                      {correction.correctedText}
                    </div>
                  </div>
                  
                  {correction.improvements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Improvements:</p>
                      <div className="flex flex-wrap gap-1">
                        {correction.improvements.map((improvement, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {improvement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};
