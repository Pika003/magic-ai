
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wand2, Copy, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { correctSentenceWithAI, isApiKeyAvailable } from '@/services/openaiService';
import { ApiKeyInput } from './ApiKeyInput';

export const CorrectSentence = () => {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [corrections, setCorrections] = useState<string[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    setHasApiKey(isApiKeyAvailable());
  }, []);

  const handleCorrection = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence to correct.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await correctSentenceWithAI(inputText);
      setCorrectedText(result.correctedText);
      setCorrections(result.improvements);
      
      toast({
        title: "Success!",
        description: "Your sentence has been corrected using AI.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to correct sentence. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence to get different results.",
        variant: "destructive"
      });
      return;
    }

    await handleCorrection();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  const clearAll = () => {
    setInputText('');
    setCorrectedText('');
    setCorrections([]);
  };

  const handleApiKeySet = () => {
    setHasApiKey(true);
  };

  if (!hasApiKey) {
    return (
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Correct Sentence</h2>
          <p className="text-slate-600">Enter your sentence and get instant AI-powered corrections</p>
        </div>
        <ApiKeyInput onApiKeySet={handleApiKeySet} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Correct Sentence</h2>
        <p className="text-slate-600">Enter your sentence and get instant AI-powered corrections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-blue-500" />
              <span>Original Sentence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your sentence here... (e.g., 'we com pleted the data base setup and fix ed the log in issue')"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
            />
            <div className="flex items-center space-x-2 mt-4">
              <Button 
                onClick={handleCorrection}
                disabled={isLoading || !inputText.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Correcting...
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
                disabled={isLoading || !inputText.trim()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>AI Corrected Sentence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg">
              {correctedText ? (
                <p className="text-slate-800 leading-relaxed">{correctedText}</p>
              ) : (
                <p className="text-slate-400 italic">AI corrected sentence will appear here...</p>
              )}
            </div>
            
            {corrections.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">AI Improvements Applied:</h4>
                <div className="flex flex-wrap gap-2">
                  {corrections.map((correction, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {correction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {correctedText && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(correctedText)}
                className="mt-4"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Corrected Text
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
